import { UserEntity } from 'src/users/entities/user.entity';
import { PermissionEntity } from 'src/permissions/entities/permission.entity';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleEntity implements Role {
  constructor(partial: Partial<RoleEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ isArray: true, description: '权限对象数组' })
  permissions?: PermissionEntity[];

  @ApiPropertyOptional({ isArray: true, description: '用户对象数组' })
  users?: UserEntity[];
}
