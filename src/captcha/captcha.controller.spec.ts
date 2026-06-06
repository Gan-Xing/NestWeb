import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaController } from './captcha.controller';
import { createMockProvider } from '../../test/unit-provider-mocks';
import { CaptchaService } from './captcha.service';

describe('CaptchaController', () => {
	let controller: CaptchaController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CaptchaController],
			providers: [createMockProvider(CaptchaService)]
		}).compile();

		controller = module.get<CaptchaController>(CaptchaController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
