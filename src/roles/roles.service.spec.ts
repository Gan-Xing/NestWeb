import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "./roles.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { PrismaService } from "src/prisma/prisma.service";

describe("RolesService", () => {
  let service: RolesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, mockProviderFactories.prismaService()],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("rejects updating the system admin role", async () => {
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      name: "admin",
    });

    await expect(service.update(1, { name: "administrator" })).rejects.toThrow(
      "系统管理员角色 admin 由系统维护，不能在后台编辑或删除",
    );
    expect(prisma.role.update).not.toHaveBeenCalled();
  });

  it("rejects deleting the system admin role", async () => {
    (prisma.role.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: "admin",
      },
    ]);

    await expect(service.removeMany([1])).rejects.toThrow(
      "系统管理员角色 admin 由系统维护，不能在后台编辑或删除",
    );
    expect(prisma.role.deleteMany).not.toHaveBeenCalled();
  });
});
