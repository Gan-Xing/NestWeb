import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { CreateMenuDto, UpdateMenuDto } from './dto';

@Injectable()
export class MenusService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const { parentId, ...rest } = createMenuDto;

    if (parentId) {
      const parentMenu = await this.prisma.permissionGroup.findUnique({
        where: { id: parentId },
      });
      if (!parentMenu) {
        throw new Error(`Parent menu with id ${parentId} does not exist`);
      }
    }

    const data = {
      ...rest,
      parentId,
    };

    return await this.prisma.permissionGroup.create({ data });
  }

  async findAll() {
    return await this.prisma.permissionGroup.findMany({
      where: {
        parentId: null,
      },
      include: {
        permissions: true,
        children: {
          include: {
            children: true, // to some depth as needed
          },
        },
      },
    });
  }

  async findMenuByUser(userId: number) {
    const user = await this.usersService.findOneWithRolesAndPermissions(userId);
    const allRoles = user.roles || [];
    const allPermissionGroupIds = allRoles.flatMap((role) =>
      role.permissions.map((permission) => permission.permissionGroupId),
    );
    const uniquePermissionGroupIds = [...new Set(allPermissionGroupIds)];

    const allMenus = await this.findAll();
    const filteredMenus = this.filterMenusByIds(
      allMenus,
      uniquePermissionGroupIds,
    );
    return filteredMenus;
  }

  private filterMenusByIds(menus, ids: number[]) {
    return menus
      .filter((menu) => {
        return (
          ids.includes(menu.id) ||
          (menu.children &&
            this.filterMenusByIds(menu.children, ids).length > 0)
        );
      })
      .map((menu) => {
        return {
          ...menu,
          children: menu.children
            ? this.filterMenusByIds(menu.children, ids)
            : [],
        };
      });
  }

  async findAllPaged(current: number, pageSize: number, name?: string) {
    let filters: any;
    let include: any;

    if (name) {
      filters = {
        name: {
          contains: name,
        },
      };
      include = {
        permissions: true,
      };
    } else {
      filters = {
        parentId: null,
      };
      include = {
        permissions: true,
        children: {
          include: {
            children: true, // to some depth as needed
          },
        },
      };
    }

    const total = await this.prisma.permissionGroup.count({
      where: filters,
    });

    const data = await this.prisma.permissionGroup.findMany({
      skip: (current - 1) * pageSize,
      take: pageSize,
      where: filters,
      include: include,
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

  async findOne(id: number) {
    return await this.prisma.permissionGroup.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const existingMenu = await this.prisma.permissionGroup.findUnique({
      where: { id },
    });
    if (!existingMenu) {
      throw new Error(`Menu with id ${id} does not exist`);
    }

    const { parentId, ...rest } = updateMenuDto;

    if (parentId) {
      const parentMenu = await this.prisma.permissionGroup.findUnique({
        where: { id: parentId },
      });
      if (!parentMenu) {
        throw new Error(`Parent menu with id ${parentId} does not exist`);
      }
    }

    const data = {
      ...rest,
      parentId,
    };

    return await this.prisma.permissionGroup.update({
      where: { id },
      data,
    });
  }

  async removeMenusByIds(ids: number[]) {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async remove(id: number) {
    const existingMenu = await this.prisma.permissionGroup.findUnique({
      where: { id },
    });
    if (!existingMenu) {
      throw new Error(`Menu with id ${id} does not exist`);
    }

    // Recursively get all child menu IDs
    const childMenuIds = await this.getChildMenuIds(id);

    // Delete all child menus in one go
    await this.prisma.permissionGroup.deleteMany({
      where: { id: { in: childMenuIds } },
    });

    // Delete the parent menu
    return await this.prisma.permissionGroup.delete({
      where: { id },
    });
  }

  async getChildMenuIds(
    parentId: number,
    ids: number[] = [],
  ): Promise<number[]> {
    const childMenus = await this.prisma.permissionGroup.findMany({
      where: { parentId },
    });

    for (const childMenu of childMenus) {
      ids.push(childMenu.id);
      await this.getChildMenuIds(childMenu.id, ids);
    }

    return ids;
  }

}
