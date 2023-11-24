import { Controller, Get, Query, Res, HttpStatus, SerializeOptions } from '@nestjs/common';
import { Response } from 'express';
import { CaptchaService } from './captcha.service';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Public } from 'src/common';

@Controller('api/captcha')
@ApiTags('captcha')
@SerializeOptions({
	excludeExtraneousValues: true
})
export class CaptchaController {
	constructor(private readonly captchaService: CaptchaService) {}

	@Public()
	@Get()
	@ApiOkResponse({ description: 'Get captcha image and token.' })
	async getCaptcha(@Res() res: Response) {
		const { image, token } = await this.captchaService.createCaptcha();
		return res.status(HttpStatus.OK).json({ image, token });
	}

	@Public()
	@Get('validate')
	@ApiOkResponse({ description: 'Validate captcha token.' })
	async validateCaptcha(
		@Query('token') token: string,
		@Query('input') input: string,
		@Res() res: Response
	) {
		const isValid = await this.captchaService.validateCaptcha(token, input);
		return res.status(HttpStatus.OK).json({ isValid });
	}
}
