import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CaptchaService {
	constructor(private readonly redisService: RedisService) {}

	async createCaptcha() {
		const captcha = svgCaptcha.create();
		const token = `captcha_${Date.now()}_${randomBytes(8).toString('hex')}`;
		await this.redisService.set(token, captcha.text, 300);
		return { image: captcha.data, token };
	}

	async validateCaptcha(token: string, input: string): Promise<boolean> {
		const storedCaptcha = await this.redisService.get(token);
		return storedCaptcha === input;
	}
}
