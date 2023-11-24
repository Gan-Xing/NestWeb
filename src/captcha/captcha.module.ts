import { Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';
import { RedisModule } from 'src/redis/redis.module'; // 假设您已有 RedisModule

@Module({
	imports: [RedisModule],
	providers: [CaptchaService],
	exports: [CaptchaService], // 确保导出 CaptchaService
	controllers: [CaptchaController]
})
export class CaptchaModule {}
