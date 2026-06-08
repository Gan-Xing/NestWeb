import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalActionType,
  ApprovalApproverType,
  ApprovalRequestStatus,
  MessageCategory,
  Prisma,
} from "@prisma/client";
import { MessagesService } from "src/messages/messages.service";
import { PrismaService } from "src/prisma/prisma.service";
import { isUserActive } from "src/users/constants/user-status";
import {
  ApprovalActionDto,
  CreateApprovalRequestDto,
  QueryApprovalRequestDto,
} from "./dto";

const APPROVAL_BUSINESS_TYPE = "approval_request";

type CurrentUserRef = {
  id: number;
  isAdmin?: boolean;
};

@Injectable()
export class ApprovalRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  async findAll(query: QueryApprovalRequestDto, currentUser: CurrentUserRef) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const roleCodes = await this.getUserRoleCodes(currentUser.id);
    const canManage = await this.canManageApprovals(currentUser);
    const where = this.buildWhere(query, currentUser, roleCodes, canManage);

    const [total, data] = await Promise.all([
      this.prisma.approvalRequest.count({ where }),
      this.prisma.approvalRequest.findMany({
        where,
        include: this.approvalInclude(),
        orderBy: { createdAt: "desc" },
        skip: (current - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      pagination: {
        current,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number, currentUser: CurrentUserRef) {
    const request = await this.findRequestOrThrow(id);
    await this.assertCanView(request, currentUser);

    return request;
  }

  async create(dto: CreateApprovalRequestDto, applicantId: number) {
    this.assertValidApprover(dto);
    await this.assertApproverExists(dto);

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.approvalRequest.create({
        data: {
          title: dto.title,
          description: dto.description,
          businessType: dto.businessType,
          businessId: dto.businessId,
          payload: dto.payload as Prisma.InputJsonValue | undefined,
          applicantId,
          approverType: dto.approverType as ApprovalApproverType,
          approverUserId:
            dto.approverType === "USER" ? dto.approverUserId : null,
          approverRoleCode:
            dto.approverType === "ROLE" ? dto.approverRoleCode : null,
        },
      });

      await tx.approvalAction.create({
        data: {
          requestId: created.id,
          actorId: applicantId,
          action: ApprovalActionType.SUBMIT,
        },
      });

      return created;
    });

    await this.createApprovalTodos(request.id, dto, applicantId);

    return this.findRequestOrThrow(request.id);
  }

  async approve(
    id: number,
    currentUser: CurrentUserRef,
    dto: ApprovalActionDto,
  ) {
    return this.decide(
      id,
      currentUser,
      ApprovalRequestStatus.APPROVED,
      ApprovalActionType.APPROVE,
      dto.comment,
    );
  }

  async reject(
    id: number,
    currentUser: CurrentUserRef,
    dto: ApprovalActionDto,
  ) {
    return this.decide(
      id,
      currentUser,
      ApprovalRequestStatus.REJECTED,
      ApprovalActionType.REJECT,
      dto.comment,
    );
  }

  async cancel(
    id: number,
    currentUser: CurrentUserRef,
    dto: ApprovalActionDto,
  ) {
    const request = await this.findRequestOrThrow(id);

    if (request.status !== ApprovalRequestStatus.PENDING) {
      throw new BadRequestException("只能取消待审批请求");
    }

    const canCancelAny =
      currentUser.isAdmin ||
      (await this.userHasPermission(
        currentUser.id,
        "approval.requests.cancel",
      )) ||
      (await this.userHasPermission(
        currentUser.id,
        "approval.requests.manage",
      ));

    if (request.applicantId !== currentUser.id && !canCancelAny) {
      throw new ForbiddenException("没有取消该审批请求的权限");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: ApprovalRequestStatus.CANCELLED,
          decidedAt: new Date(),
        },
      });
      await tx.approvalAction.create({
        data: {
          requestId: id,
          actorId: currentUser.id,
          action: ApprovalActionType.CANCEL,
          comment: dto.comment,
        },
      });
    });

    await this.messagesService.cancelBusinessTodos(
      APPROVAL_BUSINESS_TYPE,
      String(id),
    );
    await this.notifyApplicant(id, "审批请求已取消", dto.comment);

    return this.findRequestOrThrow(id);
  }

  async comment(
    id: number,
    currentUser: CurrentUserRef,
    dto: ApprovalActionDto,
  ) {
    const request = await this.findRequestOrThrow(id);
    await this.assertCanView(request, currentUser);

    await this.prisma.approvalAction.create({
      data: {
        requestId: id,
        actorId: currentUser.id,
        action: ApprovalActionType.COMMENT,
        comment: dto.comment,
      },
    });

    return this.findRequestOrThrow(id);
  }

  private async decide(
    id: number,
    currentUser: CurrentUserRef,
    status: ApprovalRequestStatus,
    action: ApprovalActionType,
    comment?: string,
  ) {
    const request = await this.findRequestOrThrow(id);

    if (request.status !== ApprovalRequestStatus.PENDING) {
      throw new BadRequestException("审批请求已处理");
    }

    await this.assertCanApprove(request, currentUser);

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status,
          decidedAt: new Date(),
        },
      });
      await tx.approvalAction.create({
        data: {
          requestId: id,
          actorId: currentUser.id,
          action,
          comment,
        },
      });
    });

    await this.messagesService.completeBusinessTodos(
      APPROVAL_BUSINESS_TYPE,
      String(id),
      currentUser.id,
    );
    await this.messagesService.cancelBusinessTodos(
      APPROVAL_BUSINESS_TYPE,
      String(id),
      currentUser.id,
    );
    await this.notifyApplicant(
      id,
      status === ApprovalRequestStatus.APPROVED
        ? "审批请求已通过"
        : "审批请求已驳回",
      comment,
    );

    return this.findRequestOrThrow(id);
  }

  private async createApprovalTodos(
    requestId: number,
    dto: CreateApprovalRequestDto,
    applicantId: number,
  ) {
    const input = {
      title: `待审批：${dto.title}`,
      content: dto.description,
      category: MessageCategory.APPROVAL,
      link: `/approvals/requests?id=${requestId}`,
      businessType: APPROVAL_BUSINESS_TYPE,
      businessId: String(requestId),
      createdById: applicantId,
    };

    if (dto.approverType === "USER" && dto.approverUserId) {
      await this.messagesService.createTodo({
        ...input,
        userId: dto.approverUserId,
      });
      return;
    }

    if (dto.approverType === "ROLE" && dto.approverRoleCode) {
      await this.messagesService.createTodoForRole(dto.approverRoleCode, input);
    }
  }

  private async notifyApplicant(
    requestId: number,
    title: string,
    content?: string,
  ) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId },
      select: {
        applicantId: true,
      },
    });

    if (!request) {
      return;
    }

    await this.messagesService.createNotification({
      userId: request.applicantId,
      title,
      content,
      category: MessageCategory.APPROVAL,
      link: `/approvals/requests?id=${requestId}`,
      businessType: APPROVAL_BUSINESS_TYPE,
      businessId: String(requestId),
    });
  }

  private buildWhere(
    query: QueryApprovalRequestDto,
    currentUser: CurrentUserRef,
    roleCodes: string[],
    canManage: boolean,
  ) {
    const where: Prisma.ApprovalRequestWhereInput = {};

    if (query.status) {
      where.status = query.status as ApprovalRequestStatus;
    }

    if (query.businessType) {
      where.businessType = query.businessType;
    }

    if (query.applicantId) {
      where.applicantId = query.applicantId;
    }

    if (query.approverRoleCode) {
      where.approverRoleCode = query.approverRoleCode;
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: "insensitive" } },
        { description: { contains: query.keyword, mode: "insensitive" } },
        { businessType: { contains: query.keyword, mode: "insensitive" } },
        { businessId: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.mine) {
      where.applicantId = currentUser.id;
      return where;
    }

    if (query.pendingForMe) {
      where.status = ApprovalRequestStatus.PENDING;
      where.OR = this.approverWhere(currentUser.id, roleCodes);
      return where;
    }

    if (!canManage) {
      where.OR = [
        { applicantId: currentUser.id },
        ...this.approverWhere(currentUser.id, roleCodes),
      ];
    }

    return where;
  }

  private approverWhere(userId: number, roleCodes: string[]) {
    return [
      { approverUserId: userId },
      ...(roleCodes.length ? [{ approverRoleCode: { in: roleCodes } }] : []),
    ] satisfies Prisma.ApprovalRequestWhereInput[];
  }

  private approvalInclude() {
    return {
      applicant: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      approverUser: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      actions: {
        orderBy: { createdAt: "asc" as const },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
    } satisfies Prisma.ApprovalRequestInclude;
  }

  private async findRequestOrThrow(id: number) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: this.approvalInclude(),
    });

    if (!request) {
      throw new NotFoundException("审批请求不存在");
    }

    return request;
  }

  private assertValidApprover(dto: CreateApprovalRequestDto) {
    if (dto.approverType === "USER" && !dto.approverUserId) {
      throw new BadRequestException("请选择审批用户");
    }

    if (dto.approverType === "ROLE" && !dto.approverRoleCode) {
      throw new BadRequestException("请选择审批角色");
    }
  }

  private async assertApproverExists(dto: CreateApprovalRequestDto) {
    if (dto.approverType === "USER" && dto.approverUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.approverUserId },
        select: { id: true, status: true },
      });
      if (!user || !isUserActive(user.status)) {
        throw new BadRequestException("审批用户不存在或已停用");
      }
    }

    if (dto.approverType === "ROLE" && dto.approverRoleCode) {
      const role = await this.prisma.role.findUnique({
        where: { code: dto.approverRoleCode },
        select: { id: true, enabled: true },
      });
      if (!role || !role.enabled) {
        throw new BadRequestException("审批角色不存在或已停用");
      }
    }
  }

  private async assertCanView(
    request: Awaited<ReturnType<ApprovalRequestsService["findRequestOrThrow"]>>,
    currentUser: CurrentUserRef,
  ) {
    if (await this.canManageApprovals(currentUser)) {
      return;
    }

    if (request.applicantId === currentUser.id) {
      return;
    }

    if (await this.isApprover(request, currentUser)) {
      return;
    }

    throw new ForbiddenException("没有查看该审批请求的权限");
  }

  private async assertCanApprove(
    request: Awaited<ReturnType<ApprovalRequestsService["findRequestOrThrow"]>>,
    currentUser: CurrentUserRef,
  ) {
    if (await this.isApprover(request, currentUser)) {
      return;
    }

    throw new ForbiddenException("当前用户不是该审批请求的审批人");
  }

  private async isApprover(
    request: {
      approverType: ApprovalApproverType;
      approverUserId: number | null;
      approverRoleCode: string | null;
    },
    currentUser: CurrentUserRef,
  ) {
    if (currentUser.isAdmin) {
      return true;
    }

    if (
      request.approverType === ApprovalApproverType.USER &&
      request.approverUserId === currentUser.id
    ) {
      return true;
    }

    if (
      request.approverType === ApprovalApproverType.ROLE &&
      request.approverRoleCode
    ) {
      const roleCodes = await this.getUserRoleCodes(currentUser.id);
      return roleCodes.includes(request.approverRoleCode);
    }

    return false;
  }

  private async canManageApprovals(currentUser: CurrentUserRef) {
    return (
      Boolean(currentUser.isAdmin) ||
      (await this.userHasPermission(currentUser.id, "approval.requests.manage"))
    );
  }

  private async userHasPermission(userId: number, code: string) {
    const count = await this.prisma.permission.count({
      where: {
        code,
        roles: {
          some: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  private async getUserRoleCodes(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            code: true,
          },
        },
      },
    });

    return user?.roles.map((role) => role.code) ?? [];
  }
}
