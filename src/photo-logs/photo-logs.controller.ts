import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseIntPipe,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  Query,
  UseGuards,
  Inject
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { PhotoLogsService } from './photo-logs.service';
import { CreatePhotoLogDto, PhotoLogCategory,UpdatePhotoLogDto } from './dto';
import { CurrentUser, Permissions, JwtAuthGuard } from 'src/common';
import { IStorageService } from 'src/storage/storage.interface';
import { PermissionEntity } from 'src/permissions/entities';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

@ApiTags('照片日志管理')
@Controller('api/photo-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PhotoLogsController {
  constructor(
    private readonly photoLogsService: PhotoLogsService,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(new PermissionEntity({ action: 'POST', path: '/photo-logs/upload' }))
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未找到上传的文件');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('文件大小超过限制');
    }

    const result = await this.storageService.uploadFile(file);
    return {
      success: true,
      data: {
        url: result.url,
        path: result.path,
        location: result.location,
      },
    };
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'POST', path: '/photo-logs' }))
  create(
    @Body() createPhotoLogDto: CreatePhotoLogDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.photoLogsService.create(createPhotoLogDto, userId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ description: '获取图文日志列表' })
  @Permissions(new PermissionEntity({ action: 'GET', path: '/photo-logs' }))
  async findAll(
    @CurrentUser('isAdmin') isAdmin: boolean,
    @Query('current') current: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('description') description?: string,
    @Query('area') area?: string,
    @Query('category') category?: PhotoLogCategory,
    @Query('stakeNumber') stakeNumber?: string,
    @Query('tags') tags?: string[],
    @Query('createdBy') createdByStr?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let createdBy = undefined;
    if (createdByStr) {
      try {
        createdBy = JSON.parse(createdByStr);
      } catch (err) {
        console.warn('JSON.parse(createdByStr) 失败：', err);
      }
    }

    const result = await this.photoLogsService.findAll(
      Number(current),
      Number(pageSize),
      isAdmin,
      {
        description,
        area,
        category,
        stakeNumber,
        tags: tags || [],
        createdBy,
        startDate,
        endDate,
      },
    );

    const processedData = await Promise.all(
      result.data.map(async (item) => ({
        ...item,
        photos: await Promise.all(
          item.photos.map(async (photo) => {
            if (photo.startsWith('http://') || photo.startsWith('https://')) {
              return photo;
            }
            const presignedUrl = await this.storageService.getPresignedUrl(photo);
            return presignedUrl;
          })
        ),
      }))
    );

    return {
      ...result,
      data: processedData,
    };
  }
  @Get(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'GET', path: '/photo-logs/:id' }))
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ) {
    return this.photoLogsService.findOne(id, userId, isAdmin);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'PATCH', path: '/photo-logs/:id' }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePhotoLogDto: UpdatePhotoLogDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ) {
    return this.photoLogsService.update(id, updatePhotoLogDto, userId, isAdmin);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'DELETE', path: '/photo-logs/:id' }))
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ) {
    return this.photoLogsService.remove(id, userId, isAdmin);
  }

} 