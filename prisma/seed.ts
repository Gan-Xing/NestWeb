import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import { resolveAdminSeedConfig } from "../src/common/configs/admin-seed";

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

type RoleSeed = {
  code: string;
  name: string;
  description?: string;
  sort: number;
  enabled?: boolean;
  permissions: string[];
};

type DictItemSeed = {
  code: string;
  label: string;
  value: string;
  color?: string;
  description?: string;
  sort: number;
  enabled?: boolean;
};

type DictTypeSeed = {
  code: string;
  name: string;
  description?: string;
  sort: number;
  items: DictItemSeed[];
};

type SystemConfigSeed = {
  key: string;
  name: string;
  value: string;
  valueType: string;
  group: string;
  description?: string;
  editable: boolean;
  enabled?: boolean;
  sort: number;
};

const menuTree: MenuSeed[] = [
  {
    code: "dashboard",
    name: "工作台",
    path: "/dashboard",
    icon: "DashboardOutlined",
    sort: 10,
    permissions: [
      {
        code: "dashboard.view",
        name: "查看工作台",
        action: "GET",
        path: "/dashboard",
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
          {
            code: "auth.users.disable",
            name: "启停用户",
            action: "PATCH",
            path: "/users/status",
          },
          {
            code: "auth.users.resetPassword",
            name: "重置用户密码",
            action: "POST",
            path: "/users/reset-password",
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
        ],
      },
      {
        code: "system.dicts",
        name: "字典管理",
        path: "/system/dicts",
        icon: "ProfileOutlined",
        sort: 20,
        permissions: [
          {
            code: "system.dicts.view",
            name: "查看字典",
            action: "GET",
            path: "/dicts",
          },
          {
            code: "system.dicts.create",
            name: "新增字典",
            action: "POST",
            path: "/dicts",
          },
          {
            code: "system.dicts.update",
            name: "编辑字典",
            action: "PATCH",
            path: "/dicts",
          },
          {
            code: "system.dicts.delete",
            name: "删除字典",
            action: "DELETE",
            path: "/dicts",
          },
        ],
      },
      {
        code: "system.config",
        name: "系统参数",
        path: "/system/config",
        icon: "ControlOutlined",
        sort: 30,
        permissions: [
          {
            code: "system.config.view",
            name: "查看系统参数",
            action: "GET",
            path: "/system-config",
          },
          {
            code: "system.config.update",
            name: "编辑系统参数",
            action: "PATCH",
            path: "/system-config",
          },
        ],
      },
      {
        code: "system.files",
        name: "文件中心",
        path: "/system/files",
        icon: "CloudUploadOutlined",
        sort: 40,
        permissions: [
          {
            code: "system.files.view",
            name: "查看文件",
            action: "GET",
            path: "/files",
          },
          {
            code: "system.files.upload",
            name: "上传文件",
            action: "POST",
            path: "/files/upload",
          },
          {
            code: "system.files.download",
            name: "下载文件",
            action: "GET",
            path: "/files/download",
          },
          {
            code: "system.files.delete",
            name: "删除文件",
            action: "DELETE",
            path: "/files",
          },
        ],
      },
    ],
  },
  {
    code: "security",
    name: "安全中心",
    path: "/security",
    icon: "SafetyOutlined",
    sort: 50,
    children: [
      {
        code: "security.loginLogs",
        name: "登录日志",
        path: "/security/login-logs",
        icon: "AuditOutlined",
        sort: 10,
        permissions: [
          {
            code: "security.loginLogs.view",
            name: "查看登录日志",
            action: "GET",
            path: "/login-logs",
          },
        ],
      },
    ],
  },
  {
    code: "account",
    name: "个人账号",
    path: "/account",
    icon: "UserOutlined",
    sort: 90,
    visible: false,
    children: [
      {
        code: "account.profile",
        name: "个人中心",
        path: "/account/profile",
        sort: 10,
        visible: false,
        permissions: [
          {
            code: "account.profile.view",
            name: "查看个人资料",
            action: "GET",
            path: "/account/profile",
          },
          {
            code: "account.profile.update",
            name: "编辑个人资料",
            action: "PATCH",
            path: "/account/profile",
          },
          {
            code: "account.password.change",
            name: "修改个人密码",
            action: "PATCH",
            path: "/account/password",
          },
        ],
      },
    ],
  },
];

const dictTypeSeeds: DictTypeSeed[] = [
  {
    code: "user.status",
    name: "用户状态",
    description: "账号生命周期状态",
    sort: 10,
    items: [
      { code: "active", label: "启用", value: "active", color: "success", sort: 10 },
      { code: "disabled", label: "禁用", value: "disabled", color: "error", sort: 20 },
      { code: "resigned", label: "离职", value: "resigned", color: "default", sort: 30 },
    ],
  },
  {
    code: "user.gender",
    name: "性别",
    description: "用户基础资料性别选项",
    sort: 20,
    items: [
      { code: "male", label: "男", value: "Male", color: "blue", sort: 10 },
      { code: "female", label: "女", value: "Female", color: "magenta", sort: 20 },
    ],
  },
  {
    code: "image.category",
    name: "图片分类",
    description: "图片资源分类",
    sort: 30,
    items: [
      { code: "progress", label: "进度", value: "progress", color: "blue", sort: 10 },
      { code: "safety", label: "安全", value: "safety", color: "red", sort: 20 },
      { code: "quality", label: "质量", value: "quality", color: "green", sort: 30 },
    ],
  },
  {
    code: "knowledge.document.status",
    name: "知识文档状态",
    description: "为后续知识库 MVP 预留",
    sort: 40,
    items: [
      { code: "draft", label: "草稿", value: "draft", color: "default", sort: 10 },
      { code: "published", label: "已发布", value: "published", color: "success", sort: 20 },
      { code: "archived", label: "已归档", value: "archived", color: "warning", sort: 30 },
    ],
  },
  {
    code: "knowledge.space.visibility",
    name: "知识空间可见性",
    description: "为后续知识库 MVP 预留",
    sort: 50,
    items: [
      { code: "private", label: "私有", value: "private", color: "default", sort: 10 },
      { code: "internal", label: "企业内部", value: "internal", color: "blue", sort: 20 },
      { code: "public", label: "公开", value: "public", color: "success", sort: 30 },
    ],
  },
];

const systemConfigSeeds: SystemConfigSeed[] = [
  {
    key: "app.name",
    name: "应用名称",
    value: "企业管理后台",
    valueType: "string",
    group: "app",
    description: "页面标题、品牌展示和系统识别名称",
    editable: true,
    sort: 10,
  },
  {
    key: "app.description",
    name: "应用说明",
    value: "单企业版通用后台底座",
    valueType: "string",
    group: "app",
    description: "用于工作台或关于页展示的系统说明",
    editable: true,
    sort: 20,
  },
  {
    key: "security.password.minLength",
    name: "密码最小长度",
    value: "8",
    valueType: "number",
    group: "security",
    description: "账号密码最小长度；当前后端 DTO 仍以代码校验为准",
    editable: false,
    sort: 10,
  },
  {
    key: "file.maxUploadSizeMb",
    name: "文件上传上限 MB",
    value: "50",
    valueType: "number",
    group: "file",
    description: "文件中心上传大小上限；当前接口常量为 50MB",
    editable: false,
    sort: 10,
  },
  {
    key: "knowledge.enabled",
    name: "知识库功能预留",
    value: "false",
    valueType: "boolean",
    group: "knowledge",
    description: "S4 知识库 MVP 前的功能开关预留项",
    editable: true,
    sort: 10,
  },
];

const roleSeeds: RoleSeed[] = [
  {
    code: "admin",
    name: "系统管理员",
    description: "拥有系统全部管理权限",
    sort: 0,
    permissions: [],
  },
  {
    code: "user",
    name: "普通用户",
    description: "默认登录用户能力包",
    sort: 100,
    permissions: [
      "dashboard.view",
      "account.profile.view",
      "account.profile.update",
      "account.password.change",
    ],
  },
  {
    code: "manager",
    name: "业务负责人",
    description: "面向业务管理人员的预置能力包",
    sort: 20,
    permissions: [
      "dashboard.view",
      "account.profile.view",
      "account.profile.update",
      "account.password.change",
    ],
  },
  {
    code: "operator",
    name: "运营人员",
    description: "面向日常运营人员的预置能力包",
    sort: 30,
    permissions: [
      "dashboard.view",
      "account.profile.view",
      "account.profile.update",
      "account.password.change",
    ],
  },
  {
    code: "finance",
    name: "财务人员",
    description: "面向财务业务的预置能力包",
    sort: 40,
    permissions: [
      "dashboard.view",
      "account.profile.view",
      "account.profile.update",
      "account.password.change",
    ],
  },
  {
    code: "viewer",
    name: "只读观察员",
    description: "只保留基础访问能力，适合外部或临时查看",
    sort: 90,
    permissions: ["dashboard.view", "account.profile.view"],
  },
  {
    code: "knowledge_admin",
    name: "知识库管理员",
    description: "为后续知识库 MVP 预留的能力包",
    sort: 50,
    permissions: [
      "dashboard.view",
      "account.profile.view",
      "account.profile.update",
      "account.password.change",
    ],
  },
];

const legacyMenuCodes = ["_logs_2"];
const legacyMenuPaths = ["/logs"];
const legacyPermissionAliases = [
  ["patch_users_id_3", "auth.users.update"],
  ["patch_roles_id_7", "auth.roles.update"],
  ["patch_permissions_id_11", "auth.permissions.update"],
  ["patch_menus_id_15", "auth.menus.update"],
  ["get_system_log_export_23", "system.logs.export"],
  ["delete_system_log_clear_24", "system.logs.delete"],
  ["get_system_log_25", "system.logs.view"],
  ["get_system_log_id_26", "system.logs.detail"],
  ["system.logs.audit", "system.logs.view"],
] as const;

async function main() {
  const roles = await Promise.all(roleSeeds.map(upsertRole));
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));
  const adminRole = rolesByCode.get("admin");

  if (!adminRole) {
    throw new Error("Admin role seed failed");
  }

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

  for (const roleSeed of roleSeeds) {
    const role = rolesByCode.get(roleSeed.code);
    if (!role || roleSeed.code === "admin") {
      continue;
    }

    await connectRolePermissions(role.id, roleSeed.permissions);
  }

  await upsertAdminUser(adminRole.id);
  await upsertDictTypes();
  await upsertSystemConfigs();
  await migrateLegacyPermissionAliases();
  await hideLegacyMenus();
}

async function upsertRole(role: RoleSeed) {
  return prisma.role.upsert({
    where: { code: role.code },
    create: {
      code: role.code,
      name: role.name,
      description: role.description,
      sort: role.sort,
      enabled: role.enabled ?? true,
    },
    update: {
      name: role.name,
      description: role.description,
      sort: role.sort,
      enabled: role.enabled ?? true,
    },
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

async function upsertDictTypes() {
  for (const dictTypeSeed of dictTypeSeeds) {
    const dictType = await prisma.dictType.upsert({
      where: { code: dictTypeSeed.code },
      create: {
        code: dictTypeSeed.code,
        name: dictTypeSeed.name,
        description: dictTypeSeed.description,
        sort: dictTypeSeed.sort,
        enabled: true,
      },
      update: {
        name: dictTypeSeed.name,
        description: dictTypeSeed.description,
        sort: dictTypeSeed.sort,
        enabled: true,
      },
    });

    for (const itemSeed of dictTypeSeed.items) {
      await prisma.dictItem.upsert({
        where: {
          dictTypeId_code: {
            dictTypeId: dictType.id,
            code: itemSeed.code,
          },
        },
        create: {
          dictTypeId: dictType.id,
          code: itemSeed.code,
          label: itemSeed.label,
          value: itemSeed.value,
          color: itemSeed.color,
          description: itemSeed.description,
          sort: itemSeed.sort,
          enabled: itemSeed.enabled ?? true,
        },
        update: {
          label: itemSeed.label,
          value: itemSeed.value,
          color: itemSeed.color,
          description: itemSeed.description,
          sort: itemSeed.sort,
          enabled: itemSeed.enabled ?? true,
        },
      });
    }
  }
}

async function upsertSystemConfigs() {
  for (const config of systemConfigSeeds) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      create: {
        key: config.key,
        name: config.name,
        value: config.value,
        valueType: config.valueType,
        group: config.group,
        description: config.description,
        editable: config.editable,
        enabled: config.enabled ?? true,
        sort: config.sort,
      },
      update: {
        name: config.name,
        valueType: config.valueType,
        group: config.group,
        description: config.description,
        editable: config.editable,
        enabled: config.enabled ?? true,
        sort: config.sort,
      },
    });
  }
}

async function upsertAdminUser(adminRoleId: number) {
  const admin = resolveAdminSeedConfig();
  const hashedAdminPassword = await hash(admin.password, 10);

  await prisma.user.upsert({
    where: { email: admin.email },
    create: {
      email: admin.email,
      password: hashedAdminPassword,
      username: admin.username,
      gender: "Male",
      status: "active",
      departmentId: 1,
      isAdmin: true,
      avatar: "https://gravatar.com/avatar/0000?d=mp&f=y",
      passwordUpdatedAt: new Date(),
      roles: {
        connect: [{ id: adminRoleId }],
      },
    },
    update: {
      password: hashedAdminPassword,
      username: admin.username,
      status: "active",
      passwordUpdatedAt: new Date(),
      isAdmin: true,
      roles: {
        connect: [{ id: adminRoleId }],
      },
    },
  });
}

async function hideLegacyMenus() {
  await prisma.permissionGroup.updateMany({
    where: {
      OR: [
        {
          code: {
            in: legacyMenuCodes,
          },
        },
        {
          path: {
            in: legacyMenuPaths,
          },
        },
      ],
    },
    data: {
      visible: false,
    },
  });
}

async function migrateLegacyPermissionAliases() {
  for (const [legacyCode, targetCode] of legacyPermissionAliases) {
    const legacyPermission = await prisma.permission.findUnique({
      where: { code: legacyCode },
    });
    const targetPermission = await prisma.permission.findUnique({
      where: { code: targetCode },
    });

    if (!legacyPermission || !targetPermission) {
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "_PermissionToRole" ("A", "B")
      SELECT ${targetPermission.id}, "B"
      FROM "_PermissionToRole"
      WHERE "A" = ${legacyPermission.id}
      ON CONFLICT DO NOTHING
    `;

    await prisma.permission.delete({
      where: { id: legacyPermission.id },
    });
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
