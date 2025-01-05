import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PhotoLogsService } from './photo-logs.service';
import { CreatePhotoLogDto } from './dto/create-photo-log.dto';
import { UpdatePhotoLogDto } from './dto/update-photo-log.dto';
import { CurrentUser, Permissions } from 'src/common';
import { Inject } from '@nestjs/common';
import { IStorageService } from 'src/storage/storage.interface';
import { extname } from 'path';
import { PermissionEntity } from 'src/permissions/entities';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@ApiTags('照片日志管理')
@Controller('photo-logs')
export class PhotoLogsController {
  constructor(
    private readonly photoLogsService: PhotoLogsService,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @Permissions(new PermissionEntity({ action: 'POST', path: '/photo-logs/upload' }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.storageService.uploadFile(file);
    return result;
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
  @Permissions(new PermissionEntity({ action: 'GET', path: '/photo-logs' }))
  findAll(
    @Query('current', ParseIntPipe) current: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('isAdmin') isAdmin: boolean,
  ) {
    return this.photoLogsService.findAll(current, pageSize, isAdmin);
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