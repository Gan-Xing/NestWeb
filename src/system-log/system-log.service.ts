import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogDto } from './dto/query-log.dto';
import { Prisma } from '@prisma/client';
import { transformSystemLog } from './utils/log-transformer';

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

    const [total, rawData] = await Promise.all([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 使用 transformSystemLog 转换数据，并处理可能的转换错误
    const data = rawData.map(log => {
      try {
        return transformSystemLog(log);
      } catch {
        // 如果转换失败，返回一个基本的错误对象
        return {
          id: log.id || 0,
          username: log.username || '未知用户',
          country: '未知',
          city: '未知',
          isp: '未知',
          requestDescription: `${log.method || 'UNKNOWN'} ${log.requestUrl || '/unknown'}`,
          duration: log.duration || 0,
          success: false,
          createdAt: log.createdAt || new Date(),
        };
      }
    });

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