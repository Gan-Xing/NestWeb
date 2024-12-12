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

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<PermissionEntity[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    console.log('========== 权限验证开始 ==========');
    console.log('需要的权限:', permissions);

    if (!permissions) {
      console.log('无需权限验证，直接通过');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    console.log('请求路径:', request.method, request.url);
    console.log('路由路径:', request.route.path);

    const user = request.user;
    console.log('当前用户:', user?.id);

    if (!user) {
      console.log('用户未认证');
      throw new UnauthorizedException('Not authenticated');
    }

    const userRolesResult = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { permissions: true } } },
    });

    if (!userRolesResult) {
      console.log('未找到用户');
      throw new UnauthorizedException('User not found');
    }

    console.log('用户角色:', userRolesResult.roles.map(role => role.name));
    
    if (userRolesResult.isAdmin) {
      console.log('管理员用户，直接通过');
      return true;
    }

    const userRoles = userRolesResult.roles;
    const userPermissions = userRoles.flatMap((role) => role.permissions);
    console.log('用户权限:', userPermissions.map(p => ({
      name: p.name,
      action: p.action,
      path: p.path
    })));

    const hasPermission = permissions.every((permission) =>
      userPermissions.some((userPermission) => {
        const match = userPermission.action === permission.action &&
          userPermission.path === permission.path;
        
        console.log('权限匹配检查:', {
          required: {
            action: permission.action,
            path: permission.path
          },
          actual: {
            action: userPermission.action,
            path: userPermission.path
          },
          match
        });
        
        return match;
      }),
    );

    console.log('权限验证结果:', hasPermission);
    console.log('========== 权限验证结束 ==========');

    return hasPermission;
  }
}
