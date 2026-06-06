import { Test, TestingModule } from '@nestjs/testing';
import { PermissiongroupsController } from './permissiongroups.controller';
import { PermissiongroupsService } from './permissiongroups.service';
import { createMockProvider } from '../../test/unit-provider-mocks';

describe('PermissiongroupsController', () => {
  let controller: PermissiongroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissiongroupsController],
      providers: [createMockProvider(PermissiongroupsService)],
    }).compile();

    controller = module.get<PermissiongroupsController>(
      PermissiongroupsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
