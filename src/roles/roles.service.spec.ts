import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        mockProviderFactories.prismaService(),
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
