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
        permissions: [{ id: 11, code: 'auth.view', name: '查看权限', action: 'GET', path: '/permissions' }],
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
                selectable: true,
                checkable: true,
              },
            ],
          },
          {
            key: 'permission:11',
            title: '查看权限',
            permissionId: 11,
            selectable: true,
            checkable: true,
          },
        ],
      },
    ]);
  });
});
