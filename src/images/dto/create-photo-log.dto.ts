import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';

export class LocationDto {
  @ApiProperty({ description: '纬度' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '经度' })
  @IsNumber()
  longitude: number;
}

export enum PhotoLogCategory {
  SAFETY = '安全',
  QUALITY = '质量',
  PROGRESS = '进度',
}

export class DateRangeDto {
  @ApiProperty({ description: '开始日期' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @IsString()
  endDate: string;
}

export class CreatePhotoLogDto {
  @ApiProperty({ description: '图文日志描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '区域/位置信息', required: false })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiProperty({ description: '图片URL数组' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  photos: string[];

  @ApiProperty({ description: 'GPS位置信息', required: false })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiProperty({ description: '桩号', required: false })
  @IsOptional()
  @IsString()
  stakeNumber?: string;

  @ApiProperty({ description: '偏距', required: false })
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiProperty({ description: '分类', enum: PhotoLogCategory, default: PhotoLogCategory.SAFETY })
  @IsEnum(PhotoLogCategory)
  @IsOptional()
  category?: PhotoLogCategory;

  @ApiProperty({ description: '标签数组', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
} 