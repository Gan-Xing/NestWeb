// decorators/permissions.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { PermissionEntity } from "src/permissions/entities";

export const PERMISSIONS_KEY = "permissions";
export type PermissionRequirement = PermissionEntity | string;

export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
