import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('AuthService', () => {
  let service: AuthService;

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
