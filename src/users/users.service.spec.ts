import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.passwordService(),
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
