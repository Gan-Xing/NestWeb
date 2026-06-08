import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions } from "src/common";
import { PermissionEntity } from "src/permissions/entities";
import {
  ChangePasswordDto,
  UpdateProfileDto,
} from "src/users/dto";
import { UserEntity } from "src/users/entities";
import { UsersService } from "src/users/users.service";

@Controller("api/account")
@ApiTags("account")
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  @ApiOkResponse({ type: UserEntity })
  @Permissions(new PermissionEntity({ action: "GET", path: "/account/profile" }))
  async profile(@CurrentUser("id") userId: number) {
    return new UserEntity(
      await this.usersService.findOneWithRolesPermissionsAndRecentLogin(userId),
    );
  }

  @Patch("profile")
  @ApiOkResponse({ type: UserEntity })
  @Permissions(new PermissionEntity({ action: "PATCH", path: "/account/profile" }))
  async updateProfile(
    @CurrentUser("id") userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return new UserEntity(await this.usersService.updateProfile(userId, dto));
  }

  @Patch("password")
  @ApiOkResponse({ type: Boolean })
  @Permissions(new PermissionEntity({ action: "PATCH", path: "/account/password" }))
  async changePassword(
    @CurrentUser("id") userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }
}
