import { Test, TestingModule } from '@nestjs/testing';
import { PermissiongroupsService } from './permissiongroups.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('PermissiongroupsService', () => {
  let service: PermissiongroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissiongroupsService,
        mockProviderFactories.prismaService(),
      ],
    }).compile();

    service = module.get<PermissiongroupsService>(PermissiongroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
