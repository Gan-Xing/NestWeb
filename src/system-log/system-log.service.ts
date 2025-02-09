import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogDto } from './dto/query-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SystemLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLogDto) {
    const where: Prisma.SystemLogWhereInput = {};
    const { userId, username, requestUrl, method, status, startTime, endTime } = query;
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    if (userId) where.userId = userId;
    if (username) where.username = { contains: username };
    if (requestUrl) where.requestUrl = { contains: requestUrl };
    if (method) where.method = method;
    if (status) where.status = status;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const [total, data] = await Promise.all([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      data,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const log = await this.prisma.systemLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Log #${id} not found`);
    }

    return log;
  }

  async clear(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await this.prisma.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return {
      message: `Cleared ${result.count} logs older than ${days} days`,
      count: result.count,
    };
  }

  async export(query: QueryLogDto) {
    const where: Prisma.SystemLogWhereInput = {};
    const { userId, username, requestUrl, method, status, startTime, endTime } = query;

    if (userId) where.userId = userId;
    if (username) where.username = { contains: username };
    if (requestUrl) where.requestUrl = { contains: requestUrl };
    if (method) where.method = method;
    if (status) where.status = status;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const logs = await this.prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }
} 