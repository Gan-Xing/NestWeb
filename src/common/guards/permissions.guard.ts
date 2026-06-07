// guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  PERMISSIONS_KEY,
  type PermissionRequirement,
} from "../decorators/permissions.decorator";
import { PermissionsService } from "src/permissions/permissions.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissions || permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Not authenticated");
    }

    if (user.isAdmin) {
      return true;
    }

    const hasPermission = await this.permissionsService.checkUserPermissions(
      user.id,
      permissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return hasPermission;
  }
}
