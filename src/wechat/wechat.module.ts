import { Module } from '@nestjs/common';
import { WechatService } from './wechat.service';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [ConfigModule],
	providers: [WechatService],
	exports: [WechatService]
})
export class WechatModule {}