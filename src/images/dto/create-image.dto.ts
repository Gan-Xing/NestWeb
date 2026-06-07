import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';

export class LocationDto {
  @ApiProperty({ description: '纬度' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '经度' })
  @IsNumber()
  longitude: number;
}

export enum ImageCategory {
  PROGRESS = 'progress',
  SAFETY = 'safety',
  QUALITY = 'quality',
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

  @ApiProperty({ description: '图片URL数组', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  photos: string[];

  @ApiPropertyOptional({ description: 'GPS位置信息', type: () => LocationDto })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ description: '桩号' })
  @IsOptional()
  @IsString()
  stakeNumber?: string;

  @ApiPropertyOptional({ description: '偏距' })
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional({
    description: '分类',
    enum: ImageCategory,
    default: ImageCategory.PROGRESS,
  })
  @IsOptional()
  @IsEnum(ImageCategory)
  category?: ImageCategory;

  @ApiPropertyOptional({ description: '标签数组', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
} 
