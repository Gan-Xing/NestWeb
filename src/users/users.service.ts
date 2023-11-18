import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/password/password.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PagedQuery, SortObject } from 'src/common';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}
  // user.service.ts
  async create(createUser: CreateUserDto): Promise<User> {
    const hashedPassword = await this.passwordService.hashPassword(
      createUser.password,
    );

    // 在这里处理一个角色ID数组
    const roles = await this.prisma.role.findMany({
      where: { id: { in: createUser.roles } },
    });

    if (roles.length !== createUser.roles.length) {
      throw new Error(`Some roles do not exist`);
    }

    return this.prisma.user.create({
      data: {
        avatar:
          createUser?.avatar || 'https://gravatar.com/avatar/0000?d=mp&f=y',
        isAdmin: false,
        email: createUser.email,
        password: hashedPassword,
        roles: {
          connect: roles.map((role) => ({ id: role.id })), // 连接多个角色
        },
        status: createUser.status,
        username: createUser.username,
        gender: createUser.gender,
        departmentId: 123,
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

  convertSortOrder(sortOrder: string): 'asc' | 'desc' {
    return sortOrder === 'descend' ? 'desc' : 'asc';
  }

  async findAllPaged(query: PagedQuery, sortObject: SortObject) {
    const { current, pageSize, ...filters } = query;

    if (current <= 0 || pageSize <= 0) {
      throw new Error('Invalid pagination parameters');
    }

    const where: Prisma.UserWhereInput = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value) {
          if (key === 'username') {
            acc[key] = { contains: value };
          } else if (key === 'isAdmin') {
            acc[key] = value === 'true'; // 将字符串转换为布尔值
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

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const { roles, password, ...otherData } = updateUserDto; // 解构password

    let hashedPassword;

    if (password) {
      hashedPassword = await this.passwordService.hashPassword(password);
    }

    // 创建角色更新对象
    const rolesUpdate = {
      set: roles ? roles.map((role) => ({ id: role })) : [],
    };

    return this.prisma.user.update({
      where: { id: id },
      data: {
        ...otherData,
        ...(hashedPassword && { password: hashedPassword }), // 明确地添加哈希后的密码
        roles: rolesUpdate,
      },
    });
  }

  removeByIds(ids: number[]) {
    return this.prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
