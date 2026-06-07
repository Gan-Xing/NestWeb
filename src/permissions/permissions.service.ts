import { Injectable, NotFoundException } from "@nestjs/common";
import { assertNotSystemManagedPermission } from "src/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission } from "@prisma/client";
import type { PermissionRequirement } from "src/common";
import { PermissionTreeNodeEntity } from "./entities";

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
    requiredPermissions: PermissionRequirement[],
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { permissions: true } } },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const userPermissions = user.roles.flatMap((role) => role.permissions);

    return requiredPermissions.every((permission) => {
      const code =
        typeof permission === "string" ? permission : permission.code;

      return userPermissions.some((userPermission) => {
        if (code) {
          return userPermission.code === code;
        }

        if (typeof permission === "string") {
          return false;
        }

        return (
          userPermission.action === permission.action &&
          userPermission.path === permission.path
        );
      });
    });
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const code =
      createPermissionDto.code ??
      buildPermissionCode(createPermissionDto.action, createPermissionDto.path);

    return this.prisma.permission.create({
      data: {
        ...createPermissionDto,
        code,
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

  async findTree(): Promise<PermissionTreeNodeEntity[]> {
    const groups = await this.prisma.permissionGroup.findMany({
      where: {
        parentId: null,
        visible: true,
      },
      orderBy: {
        sort: "asc",
      },
      include: {
        permissions: {
          orderBy: {
            id: "asc",
          },
        },
        children: {
          where: {
            visible: true,
          },
          orderBy: {
            sort: "asc",
          },
          include: {
            permissions: {
              orderBy: {
                id: "asc",
              },
            },
            children: {
              where: {
                visible: true,
              },
              orderBy: {
                sort: "asc",
              },
              include: {
                permissions: {
                  orderBy: {
                    id: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    return groups.map((group) => toPermissionTreeNode(group));
  }

  async findOne(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
      select: {
        code: true,
        name: true,
      },
    });

    if (!existingPermission) {
      throw new NotFoundException("Permission not found");
    }

    assertNotSystemManagedPermission(existingPermission, "编辑");

    return this.prisma.permission.update({
      where: { id },
      data: {
        ...updatePermissionDto,
      },
    });
  }

  async removeMany(ids: number[]) {
    await this.assertPermissionsAreMutable(ids, "删除");

    return this.prisma.permission.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async remove(id: number): Promise<Permission> {
    await this.assertPermissionsAreMutable([id], "删除");

    return this.prisma.permission.delete({
      where: { id },
    });
  }

  private async assertPermissionsAreMutable(
    ids: number[],
    operation: "编辑" | "删除",
  ) {
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    for (const permission of permissions) {
      assertNotSystemManagedPermission(permission, operation);
    }
  }
}

function buildPermissionCode(action: string, path: string) {
  return `${action}.${path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.+|\.+$)/g, "");
}

type PermissionGroupWithTreeRelations = {
  id: number;
  name: string;
  permissions?: Array<{
    id: number;
    code: string;
    name: string;
    action: string;
    path: string;
  }>;
  children?: PermissionGroupWithTreeRelations[];
};

const actionSortOrder: Record<string, number> = {
  GET: 10,
  POST: 20,
  PUT: 30,
  PATCH: 30,
  DELETE: 40,
};

function comparePermissionsForTree(
  left: NonNullable<PermissionGroupWithTreeRelations["permissions"]>[number],
  right: NonNullable<PermissionGroupWithTreeRelations["permissions"]>[number],
) {
  const leftOrder = actionSortOrder[left.action.toUpperCase()] ?? 99;
  const rightOrder = actionSortOrder[right.action.toUpperCase()] ?? 99;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.id - right.id;
}

function toPermissionTreeNode(
  group: PermissionGroupWithTreeRelations,
): PermissionTreeNodeEntity {
  const groupChildren = group.children?.map((child) =>
    toPermissionTreeNode(child),
  ) ?? [];
  const permissionChildren =
    group.permissions
      ?.slice()
      .sort(comparePermissionsForTree)
      .map((permission) => ({
        key: `permission:${permission.id}`,
        title: permission.name,
        permissionId: permission.id,
        code: permission.code,
        action: permission.action,
        path: permission.path,
        selectable: true,
        checkable: true,
      })) ?? [];

  return {
    key: `group:${group.id}`,
    title: group.name,
    selectable: false,
    checkable: false,
    children: [...groupChildren, ...permissionChildren],
  };
}
