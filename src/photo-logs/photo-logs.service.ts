import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePhotoLogDto } from './dto/create-photo-log.dto';
import { UpdatePhotoLogDto } from './dto/update-photo-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PhotoLogsService {
  constructor(private prisma: PrismaService) {}

  async create(createPhotoLogDto: CreatePhotoLogDto, userId: number) {
    return this.prisma.photoLog.create({
      data: {
        ...createPhotoLogDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findAll(current: number, pageSize: number, isAdmin: boolean) {
    const total = await this.prisma.photoLog.count();
    const data = await this.prisma.photoLog.findMany({
      skip: (current - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      data,
      pagination: {
        current,
        pageSize,
        total,
      },
    };
  }

  async findOne(id: number, userId: number, isAdmin: boolean) {
    const photoLog = await this.prisma.photoLog.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!photoLog) {
      throw new NotFoundException('图文日志不存在');
    }

    // 检查访问权限
    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权访问此图文日志');
    }

    return photoLog;
  }

  async update(id: number, updatePhotoLogDto: UpdatePhotoLogDto, userId: number, isAdmin: boolean) {
    // 检查日志是否存在
    const photoLog = await this.prisma.photoLog.findUnique({
      where: { id },
    });

    if (!photoLog) {
      throw new NotFoundException('图文日志不存在');
    }

    // 检查更新权限
    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权更新此图文日志');
    }

    return this.prisma.photoLog.update({
      where: { id },
      data: updatePhotoLogDto,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    // 检查日志是否存在
    const photoLog = await this.prisma.photoLog.findUnique({
      where: { id },
    });

    if (!photoLog) {
      throw new NotFoundException('图文日志不存在');
    }

    // 检查删除权限
    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权删除此图文日志');
    }

    // TODO: 删除关联的图片文件

    return this.prisma.photoLog.delete({
      where: { id },
    });
  }
} 