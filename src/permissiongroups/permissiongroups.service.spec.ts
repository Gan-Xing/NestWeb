import { Test, TestingModule } from '@nestjs/testing';
import { PermissiongroupsService } from './permissiongroups.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PermissiongroupsService', () => {
  let service: PermissiongroupsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissiongroupsService,
        mockProviderFactories.prismaService(),
      ],
    }).compile();

    service = module.get<PermissiongroupsService>(PermissiongroupsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects updating system-managed permission groups', async () => {
    (prisma.permissionGroup.findUnique as jest.Mock).mockResolvedValue({
      id: 4,
      code: 'auth.permissions',
      name: '权限管理',
    });

    await expect(service.update(4, { name: '权限配置' })).rejects.toThrow(
      '系统内置菜单「权限管理」由代码种子维护，不能在后台编辑',
    );
    expect(prisma.permissionGroup.update).not.toHaveBeenCalled();
  });

  it('rejects deleting system-managed permission groups', async () => {
    (prisma.permissionGroup.findUnique as jest.Mock).mockResolvedValue({
      id: 4,
      code: 'auth.menus',
      name: '菜单管理',
    });

    await expect(service.remove(4)).rejects.toThrow(
      '系统内置菜单「菜单管理」由代码种子维护，不能在后台删除',
    );
    expect(prisma.permissionGroup.delete).not.toHaveBeenCalled();
  });

  it('rejects deleting custom groups that contain system-managed children', async () => {
    (prisma.permissionGroup.findUnique as jest.Mock).mockResolvedValue({
      id: 100,
      code: 'custom.root',
      name: '自定义根菜单',
    });
    (prisma.permissionGroup.findMany as jest.Mock).mockImplementation((args) => {
      if (args?.where?.parentId === 100) {
        return Promise.resolve([
          {
            id: 4,
            code: 'auth.menus',
            name: '菜单管理',
          },
        ]);
      }
      if (args?.where?.parentId === 4) {
        return Promise.resolve([]);
      }
      if (args?.where?.id?.in?.includes(4)) {
        return Promise.resolve([
          {
            id: 4,
            code: 'auth.menus',
            name: '菜单管理',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    await expect(service.remove(100)).rejects.toThrow(
      '系统内置菜单「菜单管理」由代码种子维护，不能在后台删除',
    );
    expect(prisma.permissionGroup.deleteMany).not.toHaveBeenCalled();
    expect(prisma.permissionGroup.delete).not.toHaveBeenCalled();
  });
});
