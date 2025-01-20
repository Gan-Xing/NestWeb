import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';
import { ImageThumbnail, ImageLocation } from '../interfaces/image.interface';

export class LocationDto {
  @ApiProperty({ description: '纬度' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '经度' })
  @IsNumber()
  longitude: number;
}

export enum ImageCategory {
  SAFETY = '安全',
  QUALITY = '质量',
  PROGRESS = '进度',
}

export class CreateImageDto {
  @ApiProperty({ description: '图片描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '区域/位置信息' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ description: '图片URL数组' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  photos: string[];

  @ApiProperty({ description: '缩略图信息', required: false })
  @IsOptional()
  @IsArray()
  thumbnails?: ImageThumbnail[];

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

  @ApiProperty({ description: '分类', enum: ImageCategory, default: ImageCategory.SAFETY })
  @IsEnum(ImageCategory)
  @IsOptional()
  category?: ImageCategory;

  @ApiProperty({ description: '标签数组', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
} 