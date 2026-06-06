import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('MenusService', () => {
  let service: MenusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.usersService(),
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
