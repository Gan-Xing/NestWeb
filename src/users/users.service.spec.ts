import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { PrismaService } from "src/prisma/prisma.service";
import { PasswordService } from "src/password/password.service";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.passwordService(),
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("rejects deleting the current user", () => {
    expect(() => service.removeByIds([1, 2], 1)).toThrow(
      "不能删除当前登录用户",
    );
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects removing the current admin role from self", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      roles: [{ name: "admin" }],
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      name: "admin",
    });

    await expect(service.updateUser(1, { roles: [11] }, 1)).rejects.toThrow(
      "不能移除自己当前使用的 admin 管理员角色",
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("does not clear roles when update payload omits roles", async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 2 });
    (passwordService.hashPassword as jest.Mock).mockResolvedValue(
      "hashed-password",
    );

    await service.updateUser(2, { password: "new-password" }, 1);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          roles: expect.anything(),
        }),
      }),
    );
  });
});
