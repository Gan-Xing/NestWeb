import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePhotoLogDto, PhotoLogCategory } from './dto/create-photo-log.dto';
import { UpdatePhotoLogDto } from './dto/update-photo-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IStorageService } from 'src/storage/storage.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PhotoLogsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  async create(createPhotoLogDto: CreatePhotoLogDto, userId: number) {
    const { description, area, photos, location, stakeNumber, offset, category, tags } = createPhotoLogDto;
    
    const data = {
      description,
      area,
      photos,
      location: location ? JSON.stringify(location) : undefined,
      stakeNumber,
      offset,
      category: category || '进度',
      tags: tags || [],
      createdById: userId,
    };

    return this.prisma.photoLog.create({
      data,
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
    params?: {
      description?: string;
      area?: string;
      category?: PhotoLogCategory;
      stakeNumber?: string;
      tags?: string[];
      createdBy?: { username?: string };
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: any = {};
    
    if (params?.description) {
      where.description = { contains: params.description, mode: 'insensitive' };
    }
    if (params?.area) {
      where.area = { contains: params.area, mode: 'insensitive' };
    }
    if (params?.category) {
      where.category = params.category;
    }
    if (params?.stakeNumber) {
      where.stakeNumber = { contains: params.stakeNumber, mode: 'insensitive' };
    }
    
    if (params?.tags?.length) {
      where.tags = { hasSome: params.tags };
    }

    if (params?.createdBy?.username) {
      where.createdBy = {
        username: { contains: params.createdBy.username, mode: 'insensitive' },
      };
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    const total = await this.prisma.photoLog.count({ where });
    const data = await this.prisma.photoLog.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const processedData = await Promise.all(
      data.map(async (item) => ({
        ...item,
        photos: await Promise.all(
          item.photos.map(async (photo) => {
            if (photo.startsWith('http://') || photo.startsWith('https://')) {
              return photo;
            }
            return await this.storageService.getPresignedUrl(photo);
          })
        ),
      }))
    );

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

    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权访问此图文日志');
    }

    const processedPhotos = await Promise.all(
      photoLog.photos.map(async (photo) => {
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
          return photo;
        }
        return await this.storageService.getPresignedUrl(photo);
      })
    );

    return {
      ...photoLog,
      photos: processedPhotos,
    };
  }

  async update(id: number, updatePhotoLogDto: UpdatePhotoLogDto, userId: number, isAdmin: boolean) {
    const photoLog = await this.prisma.photoLog.findUnique({
      where: { id },
    });

    if (!photoLog) {
      throw new NotFoundException('图文日志不存在');
    }

    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权更新此图文日志');
    }

    const { location, ...restDto } = updatePhotoLogDto;
    
    const data = {
      ...restDto,
      location: location ? JSON.stringify(location) : undefined,
    };

    return this.prisma.photoLog.update({
      where: { id },
      data,
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
    const photoLog = await this.prisma.photoLog.findUnique({
      where: { id },
    });

    if (!photoLog) {
      throw new NotFoundException('图文日志不存在');
    }

    if (!isAdmin && photoLog.createdById !== userId) {
      throw new ForbiddenException('无权删除此图文日志');
    }

    try {
      const baseUrl = this.configService.get('OSS_CDN_URL') || '';
      await Promise.all(
        photoLog.photos.map(async (photo) => {
          let path = photo;
          if (baseUrl && photo.startsWith(baseUrl)) {
            path = photo.substring(baseUrl.length);
          }
          if (path) {
            await this.storageService.deleteFile(path);
          }
        })
      );
    } catch (error) {
      console.error('删除图片文件失败:', error);
    }

    return this.prisma.photoLog.delete({
      where: { id },
    });
  }
} 