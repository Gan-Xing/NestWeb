import { RoleEntity } from 'src/roles/entities/role.entity';
import { Permission } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionEntity implements Permission {
  constructor(partial: Partial<PermissionEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  permissionGroupId: number;

  @ApiPropertyOptional({ isArray: true, description: '角色对象数组' })
  roles?: RoleEntity[];
}
