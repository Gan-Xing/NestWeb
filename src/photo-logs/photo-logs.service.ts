import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePhotoLogDto } from './dto/create-photo-log.dto';
import { UpdatePhotoLogDto } from './dto/update-photo-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IStorageService } from 'src/storage/storage.interface';

@Injectable()
export class PhotoLogsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

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

  async findAll(
    current: number,
    pageSize: number,
    isAdmin: boolean,
    params?: { description?: string; area?: string; createdBy?: { username?: string } }
  ) {
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

    // 添加完整的图片URL
    const baseUrl = this.configService.get('OSS_CDN_URL') || '';
    const processedData = data.map(item => ({
      ...item,
      photos: item.photos.map(photo => {
        // 如果photo已经是完整URL，则直接返回
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
          return photo;
        }
        // 否则拼接baseUrl
        return `${baseUrl}${photo}`;
      }),
    }));

    return {
      data: processedData,
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

    // 删除关联的图片文件
    try {
      await Promise.all(
        photoLog.photos.map(async (photo) => {
          // 从URL中提取文件路径
          const url = new URL(photo);
          const path = url.pathname.split('/').pop();
          if (path) {
            await this.storageService.deleteFile(path);
          }
        })
      );
    } catch (error) {
      console.error('删除图片文件失败:', error);
      // 即使删除图片失败，我们仍然继续删除数据库记录
    }

    return this.prisma.photoLog.delete({
      where: { id },
    });
  }
} 