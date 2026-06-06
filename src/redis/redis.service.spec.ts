import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        mockProviderFactories.redisConfig(),
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
