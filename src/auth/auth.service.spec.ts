import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { UsersService } from "src/users/users.service";
import { PasswordService } from "src/password/password.service";
import { PrismaService } from "src/prisma/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  let passwordService: jest.Mocked<PasswordService>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        mockProviderFactories.jwtService(),
        mockProviderFactories.prismaService(),
        mockProviderFactories.passwordService(),
        mockProviderFactories.configService(),
        mockProviderFactories.redisService(),
        mockProviderFactories.captchaService(),
        mockProviderFactories.emailService(),
        mockProviderFactories.smsService(),
        mockProviderFactories.wechatService(),
        mockProviderFactories.httpService(),
        mockProviderFactories.usersService(),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    passwordService = module.get(PasswordService);
    prisma = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  function buildJwt(payload: Record<string, unknown>) {
    return `${Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    )}.test`;
  }

  it("rejects refresh tokens when the user no longer exists", async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue(null);

    await expect(service.refreshToken("refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(passwordService.validatePassword).not.toHaveBeenCalled();
  });

  it("rejects refresh tokens when the stored refresh hash is missing", async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue({ id: 1, hashedRt: null } as any);

    await expect(service.refreshToken("refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(passwordService.validatePassword).not.toHaveBeenCalled();
  });

  it("rotates refresh token hash when refresh succeeds", async () => {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = buildJwt({ userId: 1, exp: now + 3600 });
    const refreshToken = buildJwt({
      userId: 1,
      jti: "next-refresh-id",
      exp: now + 7200,
    });
    jwtService.verify.mockReturnValue({ userId: 1 });
    jwtService.sign
      .mockReturnValueOnce(accessToken)
      .mockReturnValueOnce(refreshToken);
    usersService.findOne.mockResolvedValue({
      id: 1,
      status: "active",
      hashedRt: "stored-refresh-hash",
    } as any);
    passwordService.validatePassword.mockResolvedValue(true);
    passwordService.hashPassword.mockResolvedValue("next-refresh-hash");

    await expect(
      service.refreshToken("current-refresh-token"),
    ).resolves.toEqual({
      accessToken,
      refreshToken,
      accessExpiresIn: (now + 3600) * 1000,
      refreshExpiresIn: (now + 7200) * 1000,
    });
    expect(passwordService.validatePassword).toHaveBeenCalledWith(
      "current-refresh-token",
      "stored-refresh-hash",
    );
    expect(usersService.updateUserToken).toHaveBeenCalledWith(
      1,
      "next-refresh-hash",
    );
  });

  it("revokes stored refresh hash when token reuse is detected", async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue({
      id: 1,
      status: "active",
      hashedRt: "current-refresh-hash",
    } as any);
    passwordService.validatePassword.mockResolvedValue(false);

    await expect(
      service.refreshToken("old-refresh-token"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.clearUserToken).toHaveBeenCalledWith(1);
    expect(usersService.updateUserToken).not.toHaveBeenCalled();
  });

  it("revokes stored refresh hash when a disabled user attempts refresh", async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue({
      id: 1,
      status: "disabled",
      hashedRt: "current-refresh-hash",
    } as any);

    await expect(service.refreshToken("refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.clearUserToken).toHaveBeenCalledWith(1);
    expect(passwordService.validatePassword).not.toHaveBeenCalled();
  });

  it("rejects disabled users and writes a failed login log", async () => {
    usersService.findOneByEmail.mockResolvedValue({
      id: 1,
      email: "disabled@example.com",
      username: "disabled-user",
      status: "disabled",
      password: "hashed-password",
    } as any);

    await expect(
      service.login("disabled@example.com", "password123", {
        ip: "127.0.0.1",
        userAgent: "jest",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(passwordService.validatePassword).not.toHaveBeenCalled();
    expect(prisma.loginLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        email: "disabled@example.com",
        success: false,
        failureCode: "user_disabled",
        ip: "127.0.0.1",
        userAgent: "jest",
      }),
    });
  });
});
