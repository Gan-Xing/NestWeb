import { BadRequestException } from "@nestjs/common";

export const hiddenNavigationMenuCodes = ["auth.permissions", "auth.menus"];

export const systemManagedMenuCodes = new Set([
  "dashboard",
  "message.center",
  "auth",
  "auth.users",
  "auth.roles",
  "auth.permissions",
  "auth.menus",
  "resources",
  "resources.images",
  "system",
  "system.logs",
  "system.dicts",
  "system.config",
  "system.files",
  "system.status",
  "system.version",
  "system.queues",
  "security",
  "security.loginLogs",
  "approval.requests",
  "common.export",
  "account",
  "account.profile",
]);

export const systemManagedPermissionCodes = new Set([
  "dashboard.view",
  "message.view",
  "message.manage",
  "message.complete",
  "auth.users.view",
  "auth.users.create",
  "auth.users.update",
  "auth.users.delete",
  "auth.roles.view",
  "auth.roles.create",
  "auth.roles.update",
  "auth.roles.delete",
  "auth.permissions.view",
  "auth.permissions.create",
  "auth.permissions.update",
  "auth.permissions.delete",
  "auth.menus.view",
  "auth.menus.create",
  "auth.menus.update",
  "auth.menus.delete",
  "resources.images.view",
  "resources.images.detail",
  "resources.images.create",
  "resources.images.upload",
  "resources.images.update",
  "resources.images.delete",
  "system.logs.view",
  "system.logs.detail",
  "system.logs.export",
  "system.logs.delete",
  "system.dicts.view",
  "system.dicts.create",
  "system.dicts.update",
  "system.dicts.delete",
  "system.config.view",
  "system.config.update",
  "system.files.view",
  "system.files.upload",
  "system.files.download",
  "system.files.delete",
  "system.status.view",
  "system.version.view",
  "system.queues.view",
  "security.loginLogs.view",
  "approval.requests.view",
  "approval.requests.create",
  "approval.requests.approve",
  "approval.requests.reject",
  "approval.requests.cancel",
  "approval.requests.manage",
  "account.profile.view",
  "account.profile.update",
  "account.password.change",
  "export.data",
]);

export function isSystemManagedMenuCode(code?: string | null) {
  return Boolean(code && systemManagedMenuCodes.has(code));
}

export function isSystemManagedPermissionCode(code?: string | null) {
  return Boolean(code && systemManagedPermissionCodes.has(code));
}

export function assertNotSystemManagedMenu(
  menu: { code: string; name: string },
  operation: "编辑" | "删除",
) {
  if (!isSystemManagedMenuCode(menu.code)) {
    return;
  }

  throw new BadRequestException(
    `系统内置菜单「${menu.name}」由代码种子维护，不能在后台${operation}`,
  );
}

export function assertNotSystemManagedPermission(
  permission: { code: string; name: string },
  operation: "编辑" | "删除",
) {
  if (!isSystemManagedPermissionCode(permission.code)) {
    return;
  }

  throw new BadRequestException(
    `系统内置权限「${permission.name}」由代码种子维护，不能在后台${operation}`,
  );
}
