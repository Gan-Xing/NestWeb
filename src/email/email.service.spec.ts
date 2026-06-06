import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        mockProviderFactories.redisService(),
        mockProviderFactories.emailProducer(),
        mockProviderFactories.i18nService(),
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
