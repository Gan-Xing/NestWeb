import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

type PermissionSeed = {
  code: string;
  name: string;
  action: string;
  path: string;
};

type MenuSeed = {
  code: string;
  name: string;
  path: string;
  icon?: string;
  sort: number;
  visible?: boolean;
  permissions?: PermissionSeed[];
  children?: MenuSeed[];
};

const menuTree: MenuSeed[] = [
  {
    code: "dashboard",
    name: "工作台",
    path: "/welcome",
    icon: "smile",
    sort: 10,
    permissions: [
      {
        code: "dashboard.view",
        name: "查看工作台",
        action: "GET",
        path: "/welcome",
      },
    ],
  },
  {
    code: "auth",
    name: "权限管理",
    path: "/auth",
    icon: "table",
    sort: 20,
    children: [
      {
        code: "auth.users",
        name: "用户管理",
        path: "/auth/users",
        sort: 10,
        permissions: [
          {
            code: "auth.users.view",
            name: "查看用户",
            action: "GET",
            path: "/users",
          },
          {
            code: "auth.users.create",
            name: "新增用户",
            action: "POST",
            path: "/users",
          },
          {
            code: "auth.users.update",
            name: "编辑用户",
            action: "PATCH",
            path: "/users",
          },
          {
            code: "auth.users.delete",
            name: "删除用户",
            action: "DELETE",
            path: "/users",
          },
        ],
      },
      {
        code: "auth.roles",
        name: "角色管理",
        path: "/auth/roles",
        sort: 20,
        permissions: [
          {
            code: "auth.roles.view",
            name: "查看角色",
            action: "GET",
            path: "/roles",
          },
          {
            code: "auth.roles.create",
            name: "新增角色",
            action: "POST",
            path: "/roles",
          },
          {
            code: "auth.roles.update",
            name: "编辑角色",
            action: "PATCH",
            path: "/roles",
          },
          {
            code: "auth.roles.delete",
            name: "删除角色",
            action: "DELETE",
            path: "/roles",
          },
        ],
      },
      {
        code: "auth.permissions",
        name: "权限管理",
        path: "/auth/permissions",
        sort: 30,
        permissions: [
          {
            code: "auth.permissions.view",
            name: "查看权限",
            action: "GET",
            path: "/permissions",
          },
          {
            code: "auth.permissions.create",
            name: "新增权限",
            action: "POST",
            path: "/permissions",
          },
          {
            code: "auth.permissions.update",
            name: "编辑权限",
            action: "PATCH",
            path: "/permissions",
          },
          {
            code: "auth.permissions.delete",
            name: "删除权限",
            action: "DELETE",
            path: "/permissions",
          },
        ],
      },
      {
        code: "auth.menus",
        name: "菜单管理",
        path: "/auth/menus",
        sort: 40,
        permissions: [
          {
            code: "auth.menus.view",
            name: "查看菜单",
            action: "GET",
            path: "/menus",
          },
          {
            code: "auth.menus.create",
            name: "新增菜单",
            action: "POST",
            path: "/menus",
          },
          {
            code: "auth.menus.update",
            name: "编辑菜单",
            action: "PATCH",
            path: "/menus",
          },
          {
            code: "auth.menus.delete",
            name: "删除菜单",
            action: "DELETE",
            path: "/menus",
          },
        ],
      },
    ],
  },
  {
    code: "resources",
    name: "资源管理",
    path: "/resources",
    icon: "FolderOutlined",
    sort: 30,
    children: [
      {
        code: "resources.images",
        name: "图片管理",
        path: "/resources/images",
        icon: "PictureOutlined",
        sort: 10,
        permissions: [
          {
            code: "resources.images.view",
            name: "查看图片列表",
            action: "GET",
            path: "/images",
          },
          {
            code: "resources.images.detail",
            name: "查看图片详情",
            action: "GET",
            path: "/images/:id",
          },
          {
            code: "resources.images.create",
            name: "新增图片",
            action: "POST",
            path: "/images",
          },
          {
            code: "resources.images.upload",
            name: "上传图片",
            action: "POST",
            path: "/images/upload",
          },
          {
            code: "resources.images.update",
            name: "更新图片",
            action: "PATCH",
            path: "/images/:id",
          },
          {
            code: "resources.images.delete",
            name: "删除图片",
            action: "DELETE",
            path: "/images/:id",
          },
        ],
      },
    ],
  },
  {
    code: "system",
    name: "系统管理",
    path: "/system",
    icon: "SettingOutlined",
    sort: 40,
    children: [
      {
        code: "system.logs",
        name: "系统日志",
        path: "/system/logs",
        icon: "FileTextOutlined",
        sort: 10,
        permissions: [
          {
            code: "system.logs.view",
            name: "查看系统日志",
            action: "GET",
            path: "/system-log",
          },
          {
            code: "system.logs.detail",
            name: "查看系统日志详情",
            action: "GET",
            path: "/system-log/:id",
          },
          {
            code: "system.logs.export",
            name: "导出系统日志",
            action: "GET",
            path: "/system-log/export",
          },
          {
            code: "system.logs.delete",
            name: "删除系统日志",
            action: "DELETE",
            path: "/system-log/clear",
          },
          {
            code: "system.logs.audit",
            name: "审计系统日志",
            action: "GET",
            path: "/system-log",
          },
        ],
      },
    ],
  },
];

async function main() {
  const adminRole = await upsertRole("admin");
  const userRole = await upsertRole("User");

  const permissionIds: number[] = [];

  for (const menu of menuTree) {
    permissionIds.push(...(await upsertMenuTree(menu)));
  }

  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: permissionIds.map((id) => ({ id })),
      },
    },
  });

  await connectRolePermissions(userRole.id, ["dashboard.view"]);
  await upsertAdminUser(adminRole.id);
}

async function upsertRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function upsertMenuTree(
  menu: MenuSeed,
  parentId?: number,
): Promise<number[]> {
  const permissionGroup = await upsertPermissionGroup(menu, parentId);
  const permissionIds: number[] = [];

  for (const permission of menu.permissions ?? []) {
    permissionIds.push(await upsertPermission(permission, permissionGroup.id));
  }

  for (const child of menu.children ?? []) {
    permissionIds.push(...(await upsertMenuTree(child, permissionGroup.id)));
  }

  return permissionIds;
}

async function upsertPermissionGroup(menu: MenuSeed, parentId?: number) {
  const existing =
    (await prisma.permissionGroup.findUnique({ where: { code: menu.code } })) ??
    (await prisma.permissionGroup.findFirst({
      where: {
        path: menu.path,
        parentId: parentId ?? null,
      },
    }));

  const data = {
    code: menu.code,
    name: menu.name,
    path: menu.path,
    icon: menu.icon,
    sort: menu.sort,
    visible: menu.visible ?? true,
    parentId: parentId ?? null,
  };

  if (existing) {
    return prisma.permissionGroup.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.permissionGroup.create({ data });
}

async function upsertPermission(
  permission: PermissionSeed,
  permissionGroupId: number,
) {
  const existing =
    (await prisma.permission.findUnique({
      where: { code: permission.code },
    })) ??
    (await prisma.permission.findFirst({
      where: {
        action: permission.action,
        path: permission.path,
        permissionGroupId,
      },
    }));

  const data = {
    ...permission,
    permissionGroupId,
  };

  if (existing) {
    const updated = await prisma.permission.update({
      where: { id: existing.id },
      data,
    });
    return updated.id;
  }

  const created = await prisma.permission.create({ data });
  return created.id;
}

async function connectRolePermissions(
  roleId: number,
  permissionCodes: string[],
) {
  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: permissionCodes,
      },
    },
  });

  await prisma.role.update({
    where: { id: roleId },
    data: {
      permissions: {
        connect: permissions.map((permission) => ({ id: permission.id })),
      },
    },
  });
}

async function upsertAdminUser(adminRoleId: number) {
  const hashedAdminPassword = await hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      password: hashedAdminPassword,
      username: "admin",
      gender: "Male",
      departmentId: 1,
      isAdmin: true,
      avatar: "https://gravatar.com/avatar/0000?d=mp&f=y",
      roles: {
        connect: [{ id: adminRoleId }],
      },
    },
    update: {
      isAdmin: true,
      roles: {
        connect: [{ id: adminRoleId }],
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
