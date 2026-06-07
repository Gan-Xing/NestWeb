import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        mockProviderFactories.prismaService(),
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns menu grouped permission tree nodes', async () => {
    (prisma.permissionGroup.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: '权限管理',
        permissions: [
          {
            id: 11,
            code: 'auth.view',
            name: '查看权限',
            action: 'GET',
            path: '/permissions',
          },
        ],
        children: [
          {
            id: 2,
            name: '角色管理',
            permissions: [
              { id: 21, code: 'auth.roles.create', name: '新增角色', action: 'POST', path: '/roles' },
            ],
            children: [],
          },
        ],
      },
    ]);

    await expect(service.findTree()).resolves.toEqual([
      {
        key: 'group:1',
        title: '权限管理',
        selectable: false,
        checkable: false,
        children: [
          {
            key: 'group:2',
            title: '角色管理',
            selectable: false,
            checkable: false,
            children: [
              {
                key: 'permission:21',
                title: '新增角色',
                permissionId: 21,
                code: 'auth.roles.create',
                action: 'POST',
                path: '/roles',
                selectable: true,
                checkable: true,
              },
            ],
          },
          {
            key: 'permission:11',
            title: '查看权限',
            permissionId: 11,
            code: 'auth.view',
            action: 'GET',
            path: '/permissions',
            selectable: true,
            checkable: true,
          },
        ],
      },
    ]);
  });

  it('orders permission leaves by action priority and existing id order', async () => {
    (prisma.permissionGroup.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: '用户管理',
        permissions: [
          {
            id: 4,
            code: 'auth.users.delete',
            name: '删除用户',
            action: 'DELETE',
            path: '/users',
          },
          {
            id: 2,
            code: 'auth.users.create',
            name: '新增用户',
            action: 'POST',
            path: '/users',
          },
          {
            id: 1,
            code: 'auth.users.view',
            name: '查看用户',
            action: 'GET',
            path: '/users',
          },
          {
            id: 3,
            code: 'auth.users.update',
            name: '编辑用户',
            action: 'PATCH',
            path: '/users',
          },
        ],
        children: [],
      },
    ]);

    const tree = await service.findTree();

    expect(tree[0].children?.map((node) => node.title)).toEqual([
      '查看用户',
      '新增用户',
      '编辑用户',
      '删除用户',
    ]);
  });

  it('rejects updating system-managed permissions', async () => {
    (prisma.permission.findUnique as jest.Mock).mockResolvedValue({
      code: 'auth.roles.update',
      name: '编辑角色',
    });

    await expect(service.update(7, { name: '修改角色' })).rejects.toThrow(
      '系统内置权限「编辑角色」由代码种子维护，不能在后台编辑',
    );
    expect(prisma.permission.update).not.toHaveBeenCalled();
  });

  it('rejects deleting system-managed permissions', async () => {
    (prisma.permission.findMany as jest.Mock).mockResolvedValue([
      {
        code: 'auth.roles.delete',
        name: '删除角色',
      },
    ]);

    await expect(service.remove(8)).rejects.toThrow(
      '系统内置权限「删除角色」由代码种子维护，不能在后台删除',
    );
    expect(prisma.permission.delete).not.toHaveBeenCalled();
  });

  it('rejects batch deleting system-managed permissions', async () => {
    (prisma.permission.findMany as jest.Mock).mockResolvedValue([
      {
        code: 'auth.users.view',
        name: '查看用户',
      },
    ]);

    await expect(service.removeMany([1, 2])).rejects.toThrow(
      '系统内置权限「查看用户」由代码种子维护，不能在后台删除',
    );
    expect(prisma.permission.deleteMany).not.toHaveBeenCalled();
  });
});
