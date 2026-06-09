import { Test, TestingModule } from "@nestjs/testing";
import { MessageCategory, MessageType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { MessagesService } from "./messages.service";

describe("MessagesService", () => {
  let service: MessagesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService, mockProviderFactories.prismaService()],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
    (prisma.message.count as jest.Mock).mockResolvedValue(0);
    (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("scopes normal users to their own messages", async () => {
    await service.findAll({}, { id: 10 });

    expect(prisma.message.count).toHaveBeenCalledWith({
      where: {
        userId: 10,
      },
    });
    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 10,
        },
      }),
    );
  });

  it("allows admin to query all messages", async () => {
    await service.findAll({ scope: "all" }, { id: 1, isAdmin: true });

    expect(prisma.permission.count).not.toHaveBeenCalled();
    expect(prisma.message.count).toHaveBeenCalledWith({ where: {} });
  });

  it("allows message.manage users to query all messages", async () => {
    (prisma.permission.count as jest.Mock).mockResolvedValue(1);

    await service.findAll({ scope: "all" }, { id: 2 });

    expect(prisma.permission.count).toHaveBeenCalledWith({
      where: {
        code: "message.manage",
        roles: {
          some: {
            users: {
              some: {
                id: 2,
              },
            },
          },
        },
      },
    });
    expect(prisma.message.count).toHaveBeenCalledWith({ where: {} });
  });

  it("rejects all-message queries without message.manage", async () => {
    (prisma.permission.count as jest.Mock).mockResolvedValue(0);

    await expect(service.findAll({ scope: "all" }, { id: 3 })).rejects.toThrow(
      "没有查看全部消息的权限",
    );
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it("only lets the owner complete a pending todo", async () => {
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 99,
      userId: 10,
      type: MessageType.TODO,
      cancelledAt: null,
    });
    (prisma.message.update as jest.Mock).mockResolvedValue({ id: 99 });

    await service.completeTodo(99, 10);

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: {
        completedAt: expect.any(Date),
      },
    });
  });

  it("rejects completing another user's todo", async () => {
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 99,
      userId: 10,
      type: MessageType.TODO,
    });

    await expect(service.completeTodo(99, 11)).rejects.toThrow(
      "不能操作其他用户的消息",
    );
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it("marks only current user's unread notifications as read", async () => {
    (prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    await expect(service.markAllRead(10)).resolves.toEqual({ count: 2 });
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 10,
        type: MessageType.NOTIFICATION,
        readAt: null,
      },
      data: {
        readAt: expect.any(Date),
      },
    });
  });

  it("creates notifications and todos with expected defaults", async () => {
    (prisma.message.create as jest.Mock).mockResolvedValue({ id: 1 });

    await service.createNotification({
      userId: 1,
      title: "notice",
    });
    await service.createTodo({
      userId: 1,
      title: "todo",
    });

    expect(prisma.message.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        type: MessageType.NOTIFICATION,
        category: MessageCategory.SYSTEM,
      }),
    });
    expect(prisma.message.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        type: MessageType.TODO,
        category: MessageCategory.TASK,
      }),
    });
  });
});
