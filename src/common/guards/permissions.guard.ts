// guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionEntity } from 'src/permissions/entities';
import { PermissionsService } from 'src/permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('========== 权限验证开始 ==========');
    const permissions = this.reflector.get<PermissionEntity[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );
    console.log('需要的权限:', permissions);

    if (!permissions || permissions.length === 0) {
      console.log('无需权限验证，直接通过');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      console.log('用户未认证');
      throw new UnauthorizedException('Not authenticated');
    }

    console.log('请求路径:', request.method, request.path);
    console.log('路由路径:', request.route.path);
    console.log('当前用户:', user.id);

    if (user.isAdmin) {
      console.log('管理员用户，直接通过');
      return true;
    }

    try {
      const hasPermission = await this.permissionsService.checkUserPermissions(
        user.id,
        permissions,
      );

      if (!hasPermission) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return hasPermission;
    } catch (error) {
      console.log('权限验证出错:', error.message);
      throw error;
    }
  }
}
