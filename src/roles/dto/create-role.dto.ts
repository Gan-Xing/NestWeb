import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  IsOptional,
  Matches,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Stable role identity, such as admin or user.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9._-]*$/)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Role capability pack description.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Display order for role lists.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ description: 'Whether this role can be assigned.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

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
