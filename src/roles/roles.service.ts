import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Role } from "@prisma/client";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

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
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });
    assertRoleIsMutable(existingRole);

    const { permissions, ...otherData } = updateRoleDto;

    return this.prisma.role.update({
      where: { id: id },
      data: {
        ...otherData,
        ...(permissions
          ? {
              permissions: {
                set: permissions.map((permission) => ({ id: permission })),
              },
            }
          : {}),
      },
    });
  }

  async removeMany(ids: number[]) {
    await this.assertRolesAreRemovable(ids);

    return this.prisma.role.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async remove(id: number): Promise<Role> {
    await this.assertRolesAreRemovable([id]);

    return this.prisma.role.delete({ where: { id } });
  }

  private async assertRolesAreRemovable(ids: number[]) {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: ids } },
      select: {
        name: true,
      },
    });

    roles.forEach(assertRoleIsMutable);
  }
}

function assertRoleIsMutable(role?: { name: string } | null) {
  if (role?.name !== "admin") {
    return;
  }

  throw new BadRequestException(
    "系统管理员角色 admin 由系统维护，不能在后台编辑或删除",
  );
}
