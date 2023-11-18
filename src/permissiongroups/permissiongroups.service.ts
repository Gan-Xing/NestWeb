import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionGroupDto } from './dto/create-permissiongroup.dto';
import { UpdatePermissionGroupDto } from './dto/update-permissiongroup.dto';

@Injectable()
export class PermissiongroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissiongroupDto: CreatePermissionGroupDto) {
    const { parentId, permissions, ...rest } = createPermissiongroupDto;

    if (parentId) {
      const parentPermissionGroup =
        await this.prisma.permissionGroup.findUnique({
          where: { id: parentId },
        });
      if (!parentPermissionGroup) {
        throw new Error(
          `Parent permission group with id ${parentId} does not exist`,
        );
      }
    }

    const data = {
      ...rest,
      parentId,
      permissions: {
        connect: permissions?.map((permissionId) => ({ id: permissionId })),
      },
    };

    return await this.prisma.permissionGroup.create({ data });
  }

  async findAll() {
    return await this.prisma.permissionGroup.findMany({
      where: {
        parentId: null,
      },
      include: {
        permissions: true,
        children: {
          include: {
            children: true, // to some depth as needed
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.permissionGroup.findUnique({
      where: { id },
    });
  }

  async update(id: number, updatePermissiongroupDto: UpdatePermissionGroupDto) {
    const existingPermissionGroup =
      await this.prisma.permissionGroup.findUnique({
        where: { id },
      });
    if (!existingPermissionGroup) {
      throw new Error(`Permission group with id ${id} does not exist`);
    }

    const { parentId, permissions, ...rest } = updatePermissiongroupDto;

    if (parentId) {
      const parentPermissionGroup =
        await this.prisma.permissionGroup.findUnique({
          where: { id: parentId },
        });
      if (!parentPermissionGroup) {
        throw new Error(
          `Parent permission group with id ${parentId} does not exist`,
        );
      }
    }

    const data = {
      ...rest,
      parentId,
      permissions: permissions
        ? { connect: permissions.map((permissionId) => ({ id: permissionId })) }
        : undefined,
    };

    return await this.prisma.permissionGroup.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const existingPermissionGroup =
      await this.prisma.permissionGroup.findUnique({
        where: { id },
      });
    if (!existingPermissionGroup) {
      throw new Error(`Permission group with id ${id} does not exist`);
    }

    // Recursively remove all child permission groups
    const childPermissionGroups = await this.prisma.permissionGroup.findMany({
      where: { parentId: id },
    });
    for (const childPermissionGroup of childPermissionGroups) {
      await this.remove(childPermissionGroup.id);
    }

    return await this.prisma.permissionGroup.delete({
      where: { id },
    });
  }
}
