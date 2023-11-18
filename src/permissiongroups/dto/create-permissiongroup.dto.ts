import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsArray,
} from 'class-validator';
export class CreatePermissionGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({
    isArray: true,
    type: 'number',
    description: '权限对象数组',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true }) // 确保每个元素都是一个整数
  permissions?: number[]; // 这里应该是权限的ID数组，而不是完整的PermissionEntity
}
