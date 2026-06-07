// src/sms/sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Dypnsapi20170525, * as $Dypnsapi20170525 from '@alicloud/dypnsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import Util, * as $Util from '@alicloud/tea-util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
	private readonly logger = new Logger(SmsService.name);
	private client: Dypnsapi20170525; // 定义客户端实例

	constructor(
		private readonly configService: ConfigService // 注入 ConfigService
	) {
		this.initializeDypnsapiClient();
	}

	private initializeDypnsapiClient(): void {
		const accessKeyId = this.configService.get<string>(
			'ALIBABA_CLOUD_ACCESS_KEY_ID'
		);
		const accessKeySecret = this.configService.get<string>(
			'ALIBABA_CLOUD_ACCESS_KEY_SECRET'
		);
		const config = new $OpenApi.Config({
			accessKeyId: accessKeyId,
			accessKeySecret: accessKeySecret
		});
		config.endpoint = 'dypnsapi.aliyuncs.com';
		this.client = new Dypnsapi20170525(config); // 初始化客户端
	}

	isDryRun(): boolean {
		return this.configService.get<string>('SMS_DRY_RUN') !== 'false';
	}

	async sendSMSVerificationCode(phoneNumber: string): Promise<boolean> {
		const expirationTime = 15; // 短信验证码有效期，单位为分钟
		// 创建发送短信验证码请求
		const phoneOptions = {
			templateParam: '{"code":"##code##"}',
			signName: '甘意咨询学习',
			templateCode: 'SMS_464040638',
			phoneNumber,
			validTime: expirationTime * 60,
			returnVerifyCode: true,
			codeLength: 6
		};

		const sendSmsVerifyCodeRequest = new $Dypnsapi20170525.SendSmsVerifyCodeRequest(
			phoneOptions
		);

		try {
			if (this.isDryRun()) {
				this.logger.warn(
					`SMS dry-run enabled; skipped provider send for ${maskPhoneNumber(phoneNumber)}`
				);
				return true;
			}

			await this.client.sendSmsVerifyCodeWithOptions(
				sendSmsVerifyCodeRequest,
				new $Util.RuntimeOptions({})
			);
			return true;
		} catch (error) {
			console.error('Error sending SMS:', error);
			return false;
		}
	}

	async validateSMSVerificationCode(
		phoneNumber: string,
		verifyCode: string
	): Promise<boolean> {
		const checkSmsVerifyCodeRequest = new $Dypnsapi20170525.CheckSmsVerifyCodeRequest(
			{
				phoneNumber,
				verifyCode
			}
		);
		const runtime = new $Util.RuntimeOptions({});
		try {
			if (this.isDryRun()) {
				return Boolean(verifyCode);
			}

			await this.client.checkSmsVerifyCodeWithOptions(
				checkSmsVerifyCodeRequest,
				runtime
			);
			return true;
		} catch (error) {
			// 错误 message
			this.logger.error(error.message);
			// 诊断地址
			this.logger.error(error.data?.['Recommend']);
			Util.assertAsString(error.message);
			return false;
		}
	}
}

function maskPhoneNumber(phoneNumber: string) {
	if (phoneNumber.length <= 7) {
		return '***';
	}

	return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`;
}
