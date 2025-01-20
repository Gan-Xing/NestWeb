import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateImageDto, UpdateImageDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { IStorageService } from 'src/storage/storage.interface';
import * as path from 'path';

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  async create(createImageDto: CreateImageDto, userId: number) {
    const { description, area, photos, location, stakeNumber, offset, category, tags } = createImageDto;
    
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
      thumbnails: createImageDto.photos.map(photo => {
        const pathParts = photo.split('/');
        const filename = pathParts[pathParts.length - 1];
        const baseDir = pathParts.slice(0, -1).join('/');
        return [
          {
            size: '64x64',
            path: `${baseDir}/thumbnails/${filename.replace(/\.[^/.]+$/, '')}-64x64${path.extname(filename)}`,
          },
          {
            size: '500x500',
            path: `${baseDir}/thumbnails/${filename.replace(/\.[^/.]+$/, '')}-500x500${path.extname(filename)}`,
          }
        ];
      }).flat(),
    };

    return this.prisma.image.create({
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
    page: number,
    pageSize: number,
    isAdmin: boolean,
    filters: {
      description?: string;
      area?: string;
      category?: string;
      stakeNumber?: string;
      tags?: string[];
      createdBy?: { username?: string };
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where = this.buildWhereClause(filters);

    const [total, data] = await Promise.all([
      this.prisma.image.count({ where }),
      this.prisma.image.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
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
      }),
    ]);

    return {
      success: true,
      data,
      total,
      current: page,
      pageSize,
    };
  }

  async findOne(id: number, userId: number, isAdmin: boolean) {
    const image = await this.prisma.image.findUnique({
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

    if (!image) {
      throw new NotFoundException('图片不存在');
    }

    if (!isAdmin && image.createdById !== userId) {
      throw new ForbiddenException('无权访问此图片');
    }

    const processedPhotos = await Promise.all(
      image.photos.map(async (photo) => {
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
          return photo;
        }
        return await this.storageService.getPresignedUrl(photo);
      })
    );

    return {
      ...image,
      photos: processedPhotos,
    };
  }

  async update(id: number, updateImageDto: UpdateImageDto, userId: number, isAdmin: boolean) {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('图片不存在');
    }

    if (!isAdmin && image.createdById !== userId) {
      throw new ForbiddenException('无权更新此图片');
    }

    const { location, thumbnails, ...restDto } = updateImageDto;
    
    const data = {
      ...restDto,
      location: location ? JSON.stringify(location) : undefined,
      thumbnails: thumbnails ? thumbnails.map(t => ({ ...t })) : undefined,
    };

    return this.prisma.image.update({
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
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('图片不存在');
    }

    if (!isAdmin && image.createdById !== userId) {
      throw new ForbiddenException('无权删除此图片');
    }

    try {
      const baseUrl = this.configService.get('OSS_CDN_URL') || '';
      await Promise.all(
        image.photos.map(async (photo) => {
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

    return this.prisma.image.delete({
      where: { id },
    });
  }

  private buildWhereClause(filters: {
    description?: string;
    area?: string;
    category?: string;
    stakeNumber?: string;
    tags?: string[];
    createdBy?: { username?: string };
    startDate?: string;
    endDate?: string;
  }) {
    const { description, area, category, stakeNumber, tags, createdBy, startDate, endDate } = filters;

    const where: any = {};

    if (description) {
      where.description = {
        contains: description,
        mode: 'insensitive'
      };
    }

    if (area) {
      where.area = {
        contains: area,
        mode: 'insensitive'
      };
    }

    if (category) {
      where.category = category;
    }

    if (stakeNumber) {
      where.stakeNumber = {
        contains: stakeNumber,
        mode: 'insensitive'
      };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      };
    }

    if (createdBy?.username) {
      where.createdBy = {
        username: { contains: createdBy.username, mode: 'insensitive' },
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return where;
  }
} 