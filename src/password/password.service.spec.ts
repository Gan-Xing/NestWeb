import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        mockProviderFactories.configService(),
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
