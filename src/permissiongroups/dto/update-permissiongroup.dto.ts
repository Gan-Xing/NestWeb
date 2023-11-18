import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray } from 'class-validator';
import { CreatePermissionGroupDto } from './create-permissiongroup.dto';

export class UpdatePermissionGroupDto extends PartialType(
  CreatePermissionGroupDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

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
