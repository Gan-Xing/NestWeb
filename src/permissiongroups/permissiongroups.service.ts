import { Injectable } from "@nestjs/common";
import { assertNotSystemManagedMenu, systemManagedMenuCodes } from "src/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePermissionGroupDto } from "./dto/create-permissiongroup.dto";
import { UpdatePermissionGroupDto } from "./dto/update-permissiongroup.dto";

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
      code: rest.code ?? buildPermissionGroupCode(rest.path),
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
    assertNotSystemManagedMenu(existingPermissionGroup, "编辑");

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
      ...(rest.path && !rest.code
        ? { code: buildPermissionGroupCode(rest.path) }
        : {}),
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
    assertNotSystemManagedMenu(existingPermissionGroup, "删除");

    const childPermissionGroupIds = await this.getChildPermissionGroupIds(id);
    if (childPermissionGroupIds.length > 0) {
      await this.assertNoSystemManagedPermissionGroups(childPermissionGroupIds);
    }

    await this.prisma.permissionGroup.deleteMany({
      where: { id: { in: childPermissionGroupIds } },
    });

    return await this.prisma.permissionGroup.delete({
      where: { id },
    });
  }

  private async assertNoSystemManagedPermissionGroups(ids: number[]) {
    const permissionGroups = await this.prisma.permissionGroup.findMany({
      where: { id: { in: ids } },
      select: {
        code: true,
        name: true,
      },
    });

    const systemManagedPermissionGroup = permissionGroups.find((group) =>
      systemManagedMenuCodes.has(group.code),
    );

    if (systemManagedPermissionGroup) {
      assertNotSystemManagedMenu(systemManagedPermissionGroup, "删除");
    }
  }

  private async getChildPermissionGroupIds(
    parentId: number,
    ids: number[] = [],
  ): Promise<number[]> {
    const childPermissionGroups = await this.prisma.permissionGroup.findMany({
      where: { parentId },
    });

    for (const childPermissionGroup of childPermissionGroups) {
      ids.push(childPermissionGroup.id);
      await this.getChildPermissionGroupIds(childPermissionGroup.id, ids);
    }

    return ids;
  }
}

function buildPermissionGroupCode(path: string) {
  return path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.+|\.+$)/g, "");
}
