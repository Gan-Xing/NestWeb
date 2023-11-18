import { PermissionGroup } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionEntity } from 'src/permissions/entities/permission.entity';
export class PermissionGroupEntity implements PermissionGroup {
  constructor(partial: Partial<PermissionGroupEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  path: string;

  @ApiPropertyOptional()
  parentId: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ isArray: true, description: '权限对象数组' })
  permissions?: PermissionEntity[];

  @ApiPropertyOptional({ description: '父权限组' })
  parent?: PermissionGroupEntity;

  @ApiPropertyOptional({ isArray: true, description: '子权限组数组' })
  children?: PermissionGroupEntity[];
}
