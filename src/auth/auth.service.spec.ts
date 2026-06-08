import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from 'src/password/password.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuthService', () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects refresh tokens when the user no longer exists', async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue(null);

    await expect(service.refreshToken('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(passwordService.validatePassword).not.toHaveBeenCalled();
  });

  it('rejects refresh tokens when the stored refresh hash is missing', async () => {
    jwtService.verify.mockReturnValue({ userId: 1 });
    usersService.findOne.mockResolvedValue({ id: 1, hashedRt: null } as any);

    await expect(service.refreshToken('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(passwordService.validatePassword).not.toHaveBeenCalled();
  });

  it('rejects disabled users and writes a failed login log', async () => {
    usersService.findOneByEmail.mockResolvedValue({
      id: 1,
      email: 'disabled@example.com',
      username: 'disabled-user',
      status: 'disabled',
      password: 'hashed-password',
    } as any);

    await expect(
      service.login('disabled@example.com', 'password123', {
        ip: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(passwordService.validatePassword).not.toHaveBeenCalled();
    expect(prisma.loginLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        email: 'disabled@example.com',
        success: false,
        failureCode: 'user_disabled',
        ip: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
  });
});
