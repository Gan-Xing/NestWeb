import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission } from "@prisma/client";
import { PermissionEntity } from "./entities/permission.entity";

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getUserRoles(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user.roles.map((role) => role.name);
  }

  async checkUserPermissions(
    userId: number,
    requiredPermissions: PermissionEntity[]
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { permissions: true } } },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const userPermissions = user.roles.flatMap((role) => role.permissions);

    return requiredPermissions.every((permission) =>
      userPermissions.some(
        (userPermission) =>
          userPermission.action === permission.action &&
          userPermission.path === permission.path
      )
    );
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        ...createPermissionDto,
      },
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      include: {
        permissionGroup: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...updatePermissionDto,
      },
    });
  }

  async removeMany(ids: number[]) {
    return this.prisma.permission.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async remove(id: number): Promise<Permission> {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
