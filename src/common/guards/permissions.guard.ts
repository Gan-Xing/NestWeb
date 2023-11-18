// guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSIONS_KEY } from 'src/common/decorators';
import { PermissionEntity } from 'src/permissions/entities';
import { log } from 'console';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<PermissionEntity[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permissions) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    const userRolesResult = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { permissions: true } } },
    });

    // Ensure that userRolesResult is not null or undefined
    if (!userRolesResult) {
      throw new UnauthorizedException('User not found');
    }

    const userRoles = userRolesResult.roles;

    const userPermissions = userRoles.flatMap((role) => role.permissions);

    const hasPermission = permissions.every((permission) =>
      userPermissions.some((userPermission) => {
        console.log(
          '=================================1111',
          userPermission,
          '=================================2222',
          permission,
        );

        return (
          userPermission.action === permission.action &&
          userPermission.path === permission.path
        );
      }),
    );

    if (!hasPermission) {
      return false;
    }

    return true;
  }
}
