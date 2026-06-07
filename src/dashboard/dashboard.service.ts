import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { transformSystemLog } from "src/system-log/utils/log-transformer";
import { DashboardSummaryEntity } from "./entities/dashboard-summary.entity";

type DashboardPrincipal = {
  id: number;
  isAdmin?: boolean;
};

type DashboardAccess = {
  canViewUsers: boolean;
  canViewRoles: boolean;
  canViewImages: boolean;
  canViewLogs: boolean;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    principal: DashboardPrincipal,
  ): Promise<DashboardSummaryEntity> {
    const access = await this.resolveAccess(principal);
    const [users, roles, images, logs, recentLogs] = await Promise.all([
      access.canViewUsers ? this.prisma.user.count() : Promise.resolve(null),
      access.canViewRoles ? this.prisma.role.count() : Promise.resolve(null),
      access.canViewImages
        ? this.prisma.image.count({
            where: principal.isAdmin
              ? undefined
              : { createdById: principal.id },
          })
        : Promise.resolve(null),
      access.canViewLogs
        ? this.prisma.systemLog.count()
        : Promise.resolve(null),
      access.canViewLogs
        ? this.prisma.systemLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    return {
      health: {
        status: "ok",
        service: "nestweb-api",
        timestamp: new Date().toISOString(),
      },
      metrics: {
        users,
        roles,
        images,
        logs,
      },
      recentLogs: recentLogs.map((log) => this.toRecentLog(log)),
    };
  }

  private async resolveAccess(
    principal: DashboardPrincipal,
  ): Promise<DashboardAccess> {
    if (principal.isAdmin) {
      return {
        canViewUsers: true,
        canViewRoles: true,
        canViewImages: true,
        canViewLogs: true,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: principal.id },
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
    const permissionCodes = new Set(
      user?.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.code),
      ) ?? [],
    );

    return {
      canViewUsers: permissionCodes.has("auth.users.view"),
      canViewRoles: permissionCodes.has("auth.roles.view"),
      canViewImages: permissionCodes.has("resources.images.view"),
      canViewLogs: permissionCodes.has("system.logs.view"),
    };
  }

  private toRecentLog(log: unknown) {
    try {
      return transformSystemLog(log);
    } catch {
      const fallback = log as {
        id?: number;
        username?: string;
        method?: string;
        requestUrl?: string;
        duration?: number;
        status?: number;
        createdAt?: Date;
      };

      return {
        id: fallback.id ?? 0,
        username: fallback.username ?? "未知用户",
        requestDescription: `${fallback.method ?? "UNKNOWN"} ${
          fallback.requestUrl ?? "/unknown"
        }`,
        duration: fallback.duration ?? 0,
        success:
          typeof fallback.status === "number" &&
          fallback.status >= 200 &&
          fallback.status < 300,
        createdAt: fallback.createdAt ?? new Date(),
      };
    }
  }
}
