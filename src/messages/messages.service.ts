import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MessageCategory, MessageType, Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { isUserActive } from "src/users/constants/user-status";
import { QueryMessageDto } from "./dto";

type CurrentUserRef = {
  id: number;
  isAdmin?: boolean;
};

type CreateMessageInput = {
  userId: number;
  title: string;
  content?: string | null;
  category?: MessageCategory;
  link?: string | null;
  businessType?: string | null;
  businessId?: string | null;
  createdById?: number | null;
};

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMessageDto, currentUser: CurrentUserRef) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = await this.buildWhere(query, currentUser);

    const [total, data] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
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

  async unreadCount(currentUserId: number) {
    const [unreadNotifications, pendingTodos] = await Promise.all([
      this.prisma.message.count({
        where: {
          userId: currentUserId,
          type: MessageType.NOTIFICATION,
          readAt: null,
        },
      }),
      this.prisma.message.count({
        where: {
          userId: currentUserId,
          type: MessageType.TODO,
          completedAt: null,
          cancelledAt: null,
        },
      }),
    ]);

    return {
      unreadNotifications,
      pendingTodos,
      total: unreadNotifications + pendingTodos,
    };
  }

  async markRead(id: number, currentUserId: number) {
    const message = await this.findOwnedMessage(id, currentUserId);

    if (message.type !== MessageType.NOTIFICATION) {
      throw new BadRequestException("只有通知可以标记已读");
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        readAt: message.readAt ?? new Date(),
      },
    });
  }

  async markAllRead(currentUserId: number) {
    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        userId: currentUserId,
        type: MessageType.NOTIFICATION,
        readAt: null,
      },
      data: {
        readAt: now,
      },
    });

    return {
      count: result.count,
    };
  }

  async completeTodo(id: number, currentUserId: number) {
    const message = await this.findOwnedMessage(id, currentUserId);

    if (message.type !== MessageType.TODO) {
      throw new BadRequestException("只有待办可以完成");
    }

    if (message.cancelledAt) {
      throw new BadRequestException("待办已取消");
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        completedAt: message.completedAt ?? new Date(),
      },
    });
  }

  async cancelTodo(id: number, currentUserId: number) {
    const message = await this.findOwnedMessage(id, currentUserId);

    if (message.type !== MessageType.TODO) {
      throw new BadRequestException("只有待办可以取消");
    }

    if (message.completedAt) {
      throw new BadRequestException("待办已完成");
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        cancelledAt: message.cancelledAt ?? new Date(),
      },
    });
  }

  createNotification(input: CreateMessageInput) {
    return this.prisma.message.create({
      data: {
        ...input,
        type: MessageType.NOTIFICATION,
        category: input.category ?? MessageCategory.SYSTEM,
      },
    });
  }

  createTodo(input: CreateMessageInput) {
    return this.prisma.message.create({
      data: {
        ...input,
        type: MessageType.TODO,
        category: input.category ?? MessageCategory.TASK,
      },
    });
  }

  async createTodoForRole(
    roleCode: string,
    input: Omit<CreateMessageInput, "userId">,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        status: {
          in: ["active", "Active", "ACTIVE"],
        },
        roles: {
          some: {
            code: roleCode,
            enabled: true,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const activeUsers = users.filter((user) => isUserActive(user.status));

    if (activeUsers.length === 0) {
      return [];
    }

    await this.prisma.message.createMany({
      data: activeUsers.map((user) => ({
        ...input,
        userId: user.id,
        type: MessageType.TODO,
        category: input.category ?? MessageCategory.APPROVAL,
      })),
    });

    return this.prisma.message.findMany({
      where: {
        userId: { in: activeUsers.map((user) => user.id) },
        type: MessageType.TODO,
        businessType: input.businessType,
        businessId: input.businessId,
      },
      orderBy: { id: "asc" },
    });
  }

  async completeBusinessTodos(
    businessType: string,
    businessId: string,
    userId?: number,
  ) {
    return this.prisma.message.updateMany({
      where: {
        businessType,
        businessId,
        type: MessageType.TODO,
        ...(userId ? { userId } : {}),
        completedAt: null,
        cancelledAt: null,
      },
      data: {
        completedAt: new Date(),
      },
    });
  }

  async cancelBusinessTodos(
    businessType: string,
    businessId: string,
    exceptUserId?: number,
  ) {
    return this.prisma.message.updateMany({
      where: {
        businessType,
        businessId,
        type: MessageType.TODO,
        completedAt: null,
        cancelledAt: null,
        ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
      },
      data: {
        cancelledAt: new Date(),
      },
    });
  }

  private async buildWhere(
    query: QueryMessageDto,
    currentUser: CurrentUserRef,
  ) {
    const where: Prisma.MessageWhereInput = {};

    if (query.scope === "all") {
      const canManage = await this.userHasPermission(
        currentUser.id,
        "message.manage",
      );
      if (!currentUser.isAdmin && !canManage) {
        throw new ForbiddenException("没有查看全部消息的权限");
      }
    } else {
      where.userId = currentUser.id;
    }

    if (query.type) {
      where.type = normalizeMessageType(query.type);
    }

    if (query.category) {
      where.category = normalizeMessageCategory(query.category);
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: "insensitive" } },
        { content: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.businessType) {
      where.businessType = query.businessType;
    }

    if (query.businessId) {
      where.businessId = query.businessId;
    }

    applyMessageStateFilter(where, query.state);

    return where;
  }

  private async findOwnedMessage(id: number, currentUserId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException("消息不存在");
    }

    if (message.userId !== currentUserId) {
      throw new ForbiddenException("不能操作其他用户的消息");
    }

    return message;
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
}

function normalizeMessageType(type: string) {
  return type.toUpperCase() as MessageType;
}

function normalizeMessageCategory(category: string) {
  return category.toUpperCase() as MessageCategory;
}

function applyMessageStateFilter(
  where: Prisma.MessageWhereInput,
  state?: string,
) {
  if (!state) {
    return;
  }

  if (state === "unread") {
    where.type = MessageType.NOTIFICATION;
    where.readAt = null;
  }

  if (state === "read") {
    where.type = MessageType.NOTIFICATION;
    where.readAt = { not: null };
  }

  if (state === "pending") {
    where.type = MessageType.TODO;
    where.completedAt = null;
    where.cancelledAt = null;
  }

  if (state === "done") {
    where.type = MessageType.TODO;
    where.completedAt = { not: null };
  }

  if (state === "cancelled") {
    where.type = MessageType.TODO;
    where.cancelledAt = { not: null };
  }
}
