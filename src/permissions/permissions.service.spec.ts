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
});
