import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  const prisma = {
    user: { count: jest.fn(), findUnique: jest.fn() },
    role: { count: jest.fn() },
    image: { count: jest.fn() },
    systemLog: { count: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates health, counters, and recent logs", async () => {
    const createdAt = new Date("2026-06-07T00:00:00.000Z");
    prisma.user.count.mockResolvedValue(3);
    prisma.role.count.mockResolvedValue(2);
    prisma.image.count.mockResolvedValue(5);
    prisma.systemLog.count.mockResolvedValue(8);
    prisma.systemLog.findMany.mockResolvedValue([
      {
        id: 1,
        username: "admin",
        method: "GET",
        requestUrl: "/api/health",
        status: 200,
        duration: 12,
        createdAt,
      },
    ]);

    const service = new DashboardService(prisma as any);
    const result = await service.getSummary({ id: 1, isAdmin: true });

    expect(result.health.status).toBe("ok");
    expect(result.metrics).toEqual({
      users: 3,
      roles: 2,
      images: 5,
      logs: 8,
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.image.count).toHaveBeenCalledWith({
      where: undefined,
    });
    expect(result.recentLogs).toEqual([
      expect.objectContaining({
        id: 1,
        username: "admin",
        requestDescription: "健康检查",
        success: true,
        createdAt,
      }),
    ]);
    expect(prisma.systemLog.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  });

  it("does not expose restricted metrics or logs to dashboard-only users", async () => {
    prisma.user.findUnique.mockResolvedValue({
      roles: [
        {
          permissions: [
            { code: "dashboard.view" },
            { code: "resources.images.view" },
          ],
        },
      ],
    });
    prisma.image.count.mockResolvedValue(2);

    const service = new DashboardService(prisma as any);
    const result = await service.getSummary({ id: 7, isAdmin: false });

    expect(result.metrics).toEqual({
      users: null,
      roles: null,
      images: 2,
      logs: null,
    });
    expect(result.recentLogs).toEqual([]);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        roles: {
          select: {
            permissions: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });
    expect(prisma.user.count).not.toHaveBeenCalled();
    expect(prisma.role.count).not.toHaveBeenCalled();
    expect(prisma.systemLog.count).not.toHaveBeenCalled();
    expect(prisma.systemLog.findMany).not.toHaveBeenCalled();
    expect(prisma.image.count).toHaveBeenCalledWith({
      where: { createdById: 7 },
    });
  });
});
