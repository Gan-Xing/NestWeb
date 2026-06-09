import { Test, TestingModule } from "@nestjs/testing";
import {
  ApprovalActionType,
  ApprovalApproverType,
  ApprovalRequestStatus,
} from "@prisma/client";
import { MessagesService } from "src/messages/messages.service";
import { PrismaService } from "src/prisma/prisma.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { ApprovalRequestsService } from "./approval-requests.service";

function approvalRequest(partial: Record<string, unknown> = {}) {
  return {
    id: 10,
    title: "采购申请",
    description: "测试审批",
    businessType: "demo",
    businessId: "biz-1",
    payload: null,
    applicantId: 1,
    approverType: ApprovalApproverType.USER,
    approverUserId: 2,
    approverRoleCode: null,
    status: ApprovalRequestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    decidedAt: null,
    applicant: { id: 1, username: "applicant", email: "applicant@example.com" },
    approverUser: {
      id: 2,
      username: "approver",
      email: "approver@example.com",
    },
    actions: [],
    ...partial,
  };
}

describe("ApprovalRequestsService", () => {
  let service: ApprovalRequestsService;
  let prisma: PrismaService;
  let messagesService: jest.Mocked<MessagesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalRequestsService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.usersService(),
        mockProviderFactories.redisService(),
        mockProviderFactories.configService(),
        {
          provide: MessagesService,
          useValue: {
            createTodo: jest.fn(),
            createTodoForRole: jest.fn(),
            completeBusinessTodos: jest.fn(),
            cancelBusinessTodos: jest.fn(),
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalRequestsService>(ApprovalRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
    messagesService = module.get(MessagesService);

    (prisma.permission.count as jest.Mock).mockResolvedValue(0);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      status: "active",
      roles: [],
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      enabled: true,
    });
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback({
        approvalRequest: {
          create: jest.fn().mockResolvedValue(approvalRequest({ id: 10 })),
          update: jest.fn().mockResolvedValue(approvalRequest()),
        },
        approvalAction: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      }),
    );
  });

  it("creates approval request and generates an approver todo", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock).mockResolvedValue(
      approvalRequest(),
    );

    await service.create(
      {
        title: "采购申请",
        description: "测试审批",
        businessType: "purchase",
        businessId: "PO-1",
        approverType: "USER",
        approverUserId: 2,
      },
      1,
    );

    expect(messagesService.createTodo).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        title: "待审批：采购申请",
        businessType: "approval_request",
        businessId: "10",
        createdById: 1,
      }),
    );
  });

  it("approves a pending request and notifies the applicant", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock)
      .mockResolvedValueOnce(approvalRequest())
      .mockResolvedValueOnce({ applicantId: 1 })
      .mockResolvedValueOnce(
        approvalRequest({
          status: ApprovalRequestStatus.APPROVED,
          decidedAt: new Date(),
        }),
      );

    await service.approve(10, { id: 2 }, { comment: "approved" });

    expect(messagesService.completeBusinessTodos).toHaveBeenCalledWith(
      "approval_request",
      "10",
      2,
    );
    expect(messagesService.cancelBusinessTodos).toHaveBeenCalledWith(
      "approval_request",
      "10",
      2,
    );
    expect(messagesService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        title: "审批请求已通过",
        businessType: "approval_request",
        businessId: "10",
      }),
    );
  });

  it("rejects a pending request and notifies the applicant", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock)
      .mockResolvedValueOnce(approvalRequest())
      .mockResolvedValueOnce({ applicantId: 1 })
      .mockResolvedValueOnce(
        approvalRequest({
          status: ApprovalRequestStatus.REJECTED,
          decidedAt: new Date(),
        }),
      );

    await service.reject(10, { id: 2 }, { comment: "rejected" });

    expect(messagesService.completeBusinessTodos).toHaveBeenCalledWith(
      "approval_request",
      "10",
      2,
    );
    expect(messagesService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        title: "审批请求已驳回",
      }),
    );
  });

  it("lets the applicant cancel a pending request", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock)
      .mockResolvedValueOnce(approvalRequest({ applicantId: 1 }))
      .mockResolvedValueOnce({ applicantId: 1 })
      .mockResolvedValueOnce(
        approvalRequest({
          status: ApprovalRequestStatus.CANCELLED,
          decidedAt: new Date(),
        }),
      );

    await service.cancel(10, { id: 1 }, { comment: "cancelled" });

    expect(messagesService.cancelBusinessTodos).toHaveBeenCalledWith(
      "approval_request",
      "10",
    );
    expect(messagesService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        title: "审批请求已取消",
      }),
    );
  });

  it("rejects approval attempts from non-approvers", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock).mockResolvedValue(
      approvalRequest({ approverUserId: 2 }),
    );

    await expect(service.approve(10, { id: 3 }, {})).rejects.toThrow(
      "当前用户不是该审批请求的审批人",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects repeated decisions for processed requests", async () => {
    (prisma.approvalRequest.findUnique as jest.Mock).mockResolvedValue(
      approvalRequest({
        status: ApprovalRequestStatus.APPROVED,
        actions: [{ action: ApprovalActionType.APPROVE }],
      }),
    );

    await expect(service.reject(10, { id: 2 }, {})).rejects.toThrow(
      "审批请求已处理",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
