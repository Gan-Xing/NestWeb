import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreatePhotoLogDto {
  @ApiProperty({ description: '图文日志描述' })
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
} 