import {
  ApprovalActionType,
  ApprovalApproverType,
  ApprovalRequestStatus,
  MessageCategory,
  MessageType,
  PrismaClient,
} from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

const demoPassword = "Demo1234.";
const demoBusinessType = "demo.approval";
const approvalMessageBusinessType = "approval_request";
const demoMessageBusinessType = "demo.message";

const demoUsers = [
  {
    email: "manager@example.com",
    username: "Demo Manager",
    firstName: "Demo",
    lastName: "Manager",
    roleCode: "manager",
  },
  {
    email: "operator@example.com",
    username: "Demo Operator",
    firstName: "Demo",
    lastName: "Operator",
    roleCode: "operator",
  },
  {
    email: "finance@example.com",
    username: "Demo Finance",
    firstName: "Demo",
    lastName: "Finance",
    roleCode: "finance",
  },
  {
    email: "viewer@example.com",
    username: "Demo Viewer",
    firstName: "Demo",
    lastName: "Viewer",
    roleCode: "viewer",
  },
] as const;

type DemoUserEmail = (typeof demoUsers)[number]["email"];

async function main() {
  const roles = await loadRequiredRoles();
  const password = await hash(demoPassword, 10);
  const users = new Map<DemoUserEmail, { id: number; email: string | null }>();

  for (const userSeed of demoUsers) {
    const role = roles.get(userSeed.roleCode);
    if (!role) {
      throw new Error(
        `Role ${userSeed.roleCode} is missing. Run pnpm run db:seed before demo seed.`,
      );
    }

    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      create: {
        email: userSeed.email,
        username: userSeed.username,
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        password,
        status: "active",
        roles: {
          connect: [{ id: role.id }],
        },
      },
      update: {
        username: userSeed.username,
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        password,
        status: "active",
        roles: {
          set: [{ id: role.id }],
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    users.set(userSeed.email, user);
  }

  await resetDemoData();
  await seedDemoMessages(users);
  await seedDemoApprovals(users);
  await seedDemoFiles(users);

  console.log("Demo seed completed.");
  console.log(`Demo password for all demo users: ${demoPassword}`);
}

async function loadRequiredRoles() {
  const roles = await prisma.role.findMany({
    where: {
      code: {
        in: [...new Set(demoUsers.map((user) => user.roleCode))],
      },
    },
    select: {
      id: true,
      code: true,
    },
  });

  return new Map(roles.map((role) => [role.code, role]));
}

async function resetDemoData() {
  const demoBusinessIds = [
    "demo-message-notice",
    "demo-message-todo",
    "demo-approval-pending",
    "demo-approval-approved",
    "demo-approval-rejected",
    "demo-approval-cancelled",
  ];

  await prisma.message.deleteMany({
    where: {
      OR: [
        { businessType: demoMessageBusinessType },
        {
          businessType: approvalMessageBusinessType,
          businessId: { in: demoBusinessIds },
        },
      ],
    },
  });
  await prisma.approvalRequest.deleteMany({
    where: {
      businessType: demoBusinessType,
      businessId: { in: demoBusinessIds },
    },
  });
  await prisma.fileAsset.deleteMany({
    where: {
      storagePath: {
        startsWith: "demo/",
      },
    },
  });
}

async function seedDemoMessages(users: Map<DemoUserEmail, { id: number }>) {
  const manager = requireUser(users, "manager@example.com");
  const operator = requireUser(users, "operator@example.com");
  const viewer = requireUser(users, "viewer@example.com");

  await prisma.message.createMany({
    data: [
      {
        userId: viewer.id,
        title: "演示通知：系统交付包已准备",
        content: "这是一条用于演示消息中心通知 tab 的示例通知。",
        type: MessageType.NOTIFICATION,
        category: MessageCategory.SYSTEM,
        businessType: demoMessageBusinessType,
        businessId: "demo-message-notice",
        createdById: manager.id,
      },
      {
        userId: operator.id,
        title: "演示待办：补充业务资料",
        content: "这是一条用于演示消息中心待办和完成动作的示例待办。",
        type: MessageType.TODO,
        category: MessageCategory.TASK,
        link: "/message-center",
        businessType: demoMessageBusinessType,
        businessId: "demo-message-todo",
        createdById: manager.id,
      },
    ],
  });
}

async function seedDemoApprovals(users: Map<DemoUserEmail, { id: number }>) {
  const manager = requireUser(users, "manager@example.com");
  const operator = requireUser(users, "operator@example.com");
  const finance = requireUser(users, "finance@example.com");

  const pending = await createApproval({
    title: "演示审批：采购申请待处理",
    description: "用于演示待我审批和待办消息。",
    businessId: "demo-approval-pending",
    applicantId: operator.id,
    approverUserId: manager.id,
    status: ApprovalRequestStatus.PENDING,
  });
  await createApprovalTodo(pending.id, manager.id, operator.id, pending.title);

  const approved = await createApproval({
    title: "演示审批：合同评审已通过",
    description: "用于演示已通过审批和申请人通知。",
    businessId: "demo-approval-approved",
    applicantId: operator.id,
    approverUserId: manager.id,
    status: ApprovalRequestStatus.APPROVED,
    decidedAt: new Date(),
    action: ApprovalActionType.APPROVE,
    actorId: manager.id,
    comment: "演示数据：审批通过。",
  });
  await createApprovalNotification(
    approved.id,
    operator.id,
    "审批请求已通过",
    "demo-approval-approved",
  );

  const rejected = await createApproval({
    title: "演示审批：预算申请已驳回",
    description: "用于演示已驳回审批和申请人通知。",
    businessId: "demo-approval-rejected",
    applicantId: manager.id,
    approverUserId: finance.id,
    status: ApprovalRequestStatus.REJECTED,
    decidedAt: new Date(),
    action: ApprovalActionType.REJECT,
    actorId: finance.id,
    comment: "演示数据：预算信息不完整。",
  });
  await createApprovalNotification(
    rejected.id,
    manager.id,
    "审批请求已驳回",
    "demo-approval-rejected",
  );

  const cancelled = await createApproval({
    title: "演示审批：资源申请已取消",
    description: "用于演示已取消审批和取消通知。",
    businessId: "demo-approval-cancelled",
    applicantId: finance.id,
    approverUserId: manager.id,
    status: ApprovalRequestStatus.CANCELLED,
    decidedAt: new Date(),
    action: ApprovalActionType.CANCEL,
    actorId: finance.id,
    comment: "演示数据：申请人主动取消。",
  });
  await createApprovalNotification(
    cancelled.id,
    finance.id,
    "审批请求已取消",
    "demo-approval-cancelled",
  );
}

async function createApproval(input: {
  title: string;
  description: string;
  businessId: string;
  applicantId: number;
  approverUserId: number;
  status: ApprovalRequestStatus;
  decidedAt?: Date;
  action?: ApprovalActionType;
  actorId?: number;
  comment?: string;
}) {
  return prisma.approvalRequest.create({
    data: {
      title: input.title,
      description: input.description,
      businessType: demoBusinessType,
      businessId: input.businessId,
      applicantId: input.applicantId,
      approverType: ApprovalApproverType.USER,
      approverUserId: input.approverUserId,
      status: input.status,
      decidedAt: input.decidedAt,
      actions: {
        create: [
          {
            actorId: input.applicantId,
            action: ApprovalActionType.SUBMIT,
          },
          ...(input.action && input.actorId
            ? [
                {
                  actorId: input.actorId,
                  action: input.action,
                  comment: input.comment,
                },
              ]
            : []),
        ],
      },
    },
  });
}

async function createApprovalTodo(
  requestId: number,
  approverId: number,
  applicantId: number,
  title: string,
) {
  await prisma.message.create({
    data: {
      userId: approverId,
      title: `待审批：${title}`,
      content: "演示数据：请处理该单步审批请求。",
      type: MessageType.TODO,
      category: MessageCategory.APPROVAL,
      link: `/approvals/requests?id=${requestId}`,
      businessType: approvalMessageBusinessType,
      businessId: "demo-approval-pending",
      createdById: applicantId,
    },
  });
}

async function createApprovalNotification(
  requestId: number,
  userId: number,
  title: string,
  businessId: string,
) {
  await prisma.message.create({
    data: {
      userId,
      title,
      content: "演示数据：审批状态已变化。",
      type: MessageType.NOTIFICATION,
      category: MessageCategory.APPROVAL,
      link: `/approvals/requests?id=${requestId}`,
      businessType: approvalMessageBusinessType,
      businessId,
    },
  });
}

async function seedDemoFiles(users: Map<DemoUserEmail, { id: number }>) {
  const manager = requireUser(users, "manager@example.com");

  await prisma.fileAsset.createMany({
    data: [
      {
        originalName: "demo-delivery-checklist.pdf",
        filename: "demo-delivery-checklist.pdf",
        storagePath: "demo/demo-delivery-checklist.pdf",
        url: "/demo/demo-delivery-checklist.pdf",
        mimeType: "application/pdf",
        size: 1024,
        extension: "pdf",
        category: "demo",
        description: "演示文件元数据，不对应真实上传文件。",
        uploaderId: manager.id,
      },
      {
        originalName: "demo-approval-attachment.txt",
        filename: "demo-approval-attachment.txt",
        storagePath: "demo/demo-approval-attachment.txt",
        url: "/demo/demo-approval-attachment.txt",
        mimeType: "text/plain",
        size: 256,
        extension: "txt",
        category: "approval",
        description: "演示审批附件元数据，不对应真实上传文件。",
        uploaderId: manager.id,
      },
    ],
  });
}

function requireUser(
  users: Map<DemoUserEmail, { id: number }>,
  email: DemoUserEmail,
) {
  const user = users.get(email);
  if (!user) {
    throw new Error(`Demo user ${email} was not created.`);
  }
  return user;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
