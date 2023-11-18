import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 在这里处理一个权限ID数组
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: createRoleDto.permissions } },
    });

    if (permissions.length !== createRoleDto.permissions.length) {
      throw new Error(`Some permissions do not exist`);
    }

    return this.prisma.role.create({
      data: {
        ...createRoleDto,
        permissions: {
          connect: permissions.map((permission) => ({ id: permission.id })),
        },
      },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          select: {
            permissionGroup: {
              select: {
                name: true,
                parent: true,
              },
            },
            name: true,
          },
        },
        users: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { permissions, ...otherData } = updateRoleDto;

    // 创建权限更新对象
    const permissionsUpdate = {
      set: permissions
        ? permissions.map((permission) => ({ id: permission }))
        : [],
    };

    return this.prisma.role.update({
      where: { id: id },
      data: {
        ...otherData,
        permissions: permissionsUpdate,
      },
    });
  }

  async removeMany(ids: number[]) {
    return this.prisma.role.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async remove(id: number): Promise<Role> {
    return this.prisma.role.delete({ where: { id } });
  }
}
