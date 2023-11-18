// decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PermissionEntity } from 'src/permissions/entities';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionEntity[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
