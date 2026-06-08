import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { PasswordService } from "src/password/password.service";
import {
  ChangePasswordDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from "./dto";
import { PagedQuery, SortObject, RegisterDto } from "src/common";
import {
  isUserActive,
  normalizeUserStatus,
  USER_STATUS,
} from "./constants/user-status";

const DEFAULT_AVATAR = "https://gravatar.com/avatar/0000?d=mp&f=y";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}
  // user.service.ts
  async create(createUser: CreateUserDto): Promise<User> {
    // 确保邮箱是唯一的
    const existingEmail = await this.findOneByEmail(
      createUser.email.toLowerCase(),
    );

    if (existingEmail) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await this.passwordService.hashPassword(
      createUser.password,
    );

    // 在这里处理一个角色ID数组
    const roles = await this.findAssignableRoles(createUser.roles);

    return this.prisma.user.create({
      data: {
        avatar: createUser?.avatar || DEFAULT_AVATAR,
        isAdmin: false,
        email: createUser.email,
        password: hashedPassword,
        roles: {
          connect: roles.map((role) => ({ id: role.id })), // 连接多个角色
        },
        status: normalizeUserStatus(createUser.status),
        username: createUser.username,
        gender: createUser.gender,
        departmentId: createUser.departmentId ?? null,
        passwordUpdatedAt: new Date(),
      },
    });
  }
  async createUserByWeb(registerUser: RegisterDto): Promise<User> {
    // 确保邮箱是唯一的
    const existingEmail = await this.findOneByEmail(
      registerUser.email.toLowerCase(),
    );
    if (existingEmail) {
      throw new Error("Email already in use");
    }
    // 确保电话号码是唯一的
    if (registerUser.phoneNumber) {
      const existingPhone = await this.findOneByPhoneNumber(
        registerUser.phoneNumber,
      );
      if (existingPhone) {
        throw new Error("Phone number already in use");
      }
    }
    const hashedPassword = await this.passwordService.hashPassword(
      registerUser.password,
    );
    // 设定默认的用户角色
    const defaultRole = await this.prisma.role.findUnique({
      where: { code: "user" },
    });
    if (!defaultRole) {
      throw new Error("Default role does not exist");
    }
    return await this.prisma.user.create({
      data: {
        avatar: DEFAULT_AVATAR,
        email: registerUser.email.toLowerCase(),
        password: hashedPassword,
        status: USER_STATUS.ACTIVE,
        roles: {
          connect: [{ id: defaultRole.id }], // 连接到默认角色
        },
        username: registerUser.username,
        gender: "Male",
        firstName: registerUser.firstName,
        lastName: registerUser.lastName,
        phoneNumber: registerUser.phoneNumber,
      },
    });
  }

  async createUserWithUnionId(wechatId: string) {
    const defaultRole = await this.prisma.role.findUnique({
      where: { code: "user" },
    });
    if (!defaultRole) {
      throw new Error("Default role does not exist");
    }

    return await this.prisma.user.create({
      data: {
        wechatId,
        status: USER_STATUS.ACTIVE,
        roles: {
          connect: [{ id: defaultRole.id }], // 连接到默认角色
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: true,
      },
    });
  }

  convertSortOrder(sortOrder: string): "asc" | "desc" {
    return sortOrder === "descend" ? "desc" : "asc";
  }

  async findAllPaged(query: PagedQuery, sortObject: SortObject) {
    const { current, pageSize, ...filters } = query;

    if (current <= 0 || pageSize <= 0) {
      throw new Error("Invalid pagination parameters");
    }

    const where: Prisma.UserWhereInput = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value) {
          if (key === "username") {
            acc[key] = { contains: value };
          } else if (key === "isAdmin") {
            acc[key] = value === "true"; // 将字符串转换为布尔值
          } else {
            acc[key] = value;
          }
        }
        return acc;
      },
      {},
    );

    // 转换 sortObject 到 Prisma 所需的格式
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortObject && Object.keys(sortObject).length > 0) {
      const [key, value] = Object.entries(sortObject)[0];
      orderBy[key] = this.convertSortOrder(value); // 调用 convertSortOrder 函数
    }

    const total = await this.prisma.user.count({ where });

    const data = await this.prisma.user.findMany({
      where,
      orderBy,
      skip: (current - 1) * pageSize,
      take: pageSize,
      include: {
        roles: true,
      },
    });

    return {
      data: data,
      pagination: {
        current: current,
        pageSize: pageSize,
        total: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneWithRolesAndPermissions(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findOneWithRolesPermissionsAndRecentLogin(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        loginLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async clearUserToken(userId: number) {
    return this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
  }

  async updateUserToken(userId: number, hash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserId?: number,
  ): Promise<User> {
    const { roles, password, status, ...otherData } = updateUserDto; // 解构password

    let hashedPassword;

    if (password) {
      hashedPassword = await this.passwordService.hashPassword(password);
    }

    if (currentUserId === id && roles) {
      await this.assertSelfKeepsAdminRole(id, roles);
    }

    const assignableRoles = roles
      ? await this.findAssignableRoles(roles)
      : undefined;

    return this.prisma.user.update({
      where: { id: id },
      data: {
        ...otherData,
        ...(status && { status: normalizeUserStatus(status) }),
        ...(hashedPassword && {
          password: hashedPassword,
          passwordUpdatedAt: new Date(),
          hashedRt: null,
        }), // 明确地添加哈希后的密码
        ...(assignableRoles
          ? {
              roles: {
                set: assignableRoles.map((role) => ({ id: role.id })),
              },
            }
          : {}),
      },
    });
  }

  async updateUserStatus(
    id: number,
    dto: UpdateUserStatusDto,
    currentUserId?: number,
  ): Promise<User> {
    const status = normalizeUserStatus(dto.status);

    if (currentUserId === id && !isUserActive(status)) {
      throw new BadRequestException("不能禁用或离职当前登录用户");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        status,
        ...(isUserActive(status) ? {} : { hashedRt: null }),
      },
    });
  }

  async resetPassword(id: number, dto: ResetPasswordDto): Promise<User> {
    const hashedPassword = await this.passwordService.hashPassword(dto.password);

    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        hashedRt: null,
      },
    });
  }

  async changePassword(
    id: number,
    dto: ChangePasswordDto,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user?.password) {
      throw new BadRequestException("当前用户没有可验证的密码");
    }

    const isCurrentPasswordValid =
      await this.passwordService.validatePassword(
        dto.currentPassword,
        user.password,
      );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException("当前密码不正确");
    }

    const hashedPassword = await this.passwordService.hashPassword(
      dto.newPassword,
    );

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        hashedRt: null,
      },
    });

    return true;
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async recordSuccessfulLogin(userId: number, ip?: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
      },
    });
  }

  // 根据 wechatId 查找用户
  async findOneByWechatId(wechatId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { wechatId },
    });
  }

  removeByIds(ids: number[], currentUserId?: number) {
    assertDoesNotDeleteCurrentUser(ids, currentUserId);
    return this.prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  remove(id: number, currentUserId?: number) {
    assertDoesNotDeleteCurrentUser([id], currentUserId);
    return this.prisma.user.delete({ where: { id } });
  }

  private async assertSelfKeepsAdminRole(
    userId: number,
    nextRoleIds: number[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!user?.roles.some((role) => role.code === "admin")) {
      return;
    }

    const adminRole = await this.prisma.role.findUnique({
      where: { code: "admin" },
      select: { id: true },
    });

    if (adminRole && !nextRoleIds.includes(adminRole.id)) {
      throw new BadRequestException("不能移除自己当前使用的 admin 管理员角色");
    }
  }

  private async findAssignableRoles(roleIds: number[]) {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: {
        id: true,
        code: true,
        enabled: true,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException("部分角色不存在");
    }

    const disabledRoles = roles.filter((role) => !role.enabled);
    if (disabledRoles.length > 0) {
      throw new BadRequestException("不能分配已停用的角色");
    }

    return roles;
  }
}

function assertDoesNotDeleteCurrentUser(ids: number[], currentUserId?: number) {
  if (!currentUserId || !ids.includes(currentUserId)) {
    return;
  }

  throw new BadRequestException("不能删除当前登录用户");
}
