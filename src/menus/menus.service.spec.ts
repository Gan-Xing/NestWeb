import { Test, TestingModule } from "@nestjs/testing";
import { MenusService } from "./menus.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { PrismaService } from "src/prisma/prisma.service";

describe("MenusService", () => {
  let service: MenusService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.usersService(),
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("hides low-level maintenance pages from runtime navigation", async () => {
    (prisma.permissionGroup.findMany as jest.Mock).mockResolvedValue([]);

    await service.findAll();

    expect(prisma.permissionGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visible: true,
          code: { notIn: ["auth.permissions", "auth.menus"] },
        }),
        include: expect.objectContaining({
          children: expect.objectContaining({
            where: expect.objectContaining({
              visible: true,
              code: { notIn: ["auth.permissions", "auth.menus"] },
            }),
          }),
        }),
      }),
    );
  });

  it("rejects deleting system-managed menus", async () => {
    (prisma.permissionGroup.findUnique as jest.Mock).mockResolvedValue({
      id: 4,
      code: "auth.menus",
      name: "菜单管理",
    });

    await expect(service.remove(4)).rejects.toThrow(
      "系统内置菜单「菜单管理」由代码种子维护，不能在后台删除",
    );
    expect(prisma.permissionGroup.delete).not.toHaveBeenCalled();
  });

  it("rejects updating system-managed menus", async () => {
    (prisma.permissionGroup.findUnique as jest.Mock).mockResolvedValue({
      id: 4,
      code: "auth.menus",
      name: "菜单管理",
    });

    await expect(service.update(4, { name: "菜单配置" })).rejects.toThrow(
      "系统内置菜单「菜单管理」由代码种子维护，不能在后台编辑",
    );
    expect(prisma.permissionGroup.update).not.toHaveBeenCalled();
  });
});
