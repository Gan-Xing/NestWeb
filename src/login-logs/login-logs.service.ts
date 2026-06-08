import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryLoginLogDto } from "./dto/query-login-log.dto";

@Injectable()
export class LoginLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLoginLogDto) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [total, data] = await Promise.all([
      this.prisma.loginLog.count({ where }),
      this.prisma.loginLog.findMany({
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

  async findOne(id: number) {
    const log = await this.prisma.loginLog.findUnique({ where: { id } });

    if (!log) {
      throw new NotFoundException("登录日志不存在");
    }

    return log;
  }

  private buildWhere(query: QueryLoginLogDto): Prisma.LoginLogWhereInput {
    const where: Prisma.LoginLogWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { username: { contains: query.keyword, mode: "insensitive" } },
        { email: { contains: query.keyword, mode: "insensitive" } },
        { ip: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.username) {
      where.username = { contains: query.username, mode: "insensitive" };
    }

    if (query.email) {
      where.email = { contains: query.email, mode: "insensitive" };
    }

    if (query.ip) {
      where.ip = { contains: query.ip, mode: "insensitive" };
    }

    if (query.success !== undefined) {
      where.success = query.success;
    }

    if (query.startTime || query.endTime) {
      where.createdAt = {
        ...(query.startTime ? { gte: new Date(query.startTime) } : {}),
        ...(query.endTime ? { lte: new Date(query.endTime) } : {}),
      };
    }

    return where;
  }
}
