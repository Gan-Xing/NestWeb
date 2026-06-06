import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('CaptchaService', () => {
	let service: CaptchaService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CaptchaService,
				mockProviderFactories.redisService()
			]
		}).compile();

		service = module.get<CaptchaService>(CaptchaService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
