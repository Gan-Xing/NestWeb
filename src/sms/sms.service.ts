// src/sms/sms.service.ts
import { Injectable } from '@nestjs/common';
import Dypnsapi20170525, * as $Dypnsapi20170525 from '@alicloud/dypnsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import Util, * as $Util from '@alicloud/tea-util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
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
		let config = new $OpenApi.Config({
			accessKeyId: accessKeyId,
			accessKeySecret: accessKeySecret
		});
		config.endpoint = 'dypnsapi.aliyuncs.com';
		this.client = new Dypnsapi20170525(config); // 初始化客户端
	}

	async sendSMSVerificationCode(PhoneNumber: string): Promise<boolean> {
		const expirationTime = 15; // 短信验证码有效期，单位为分钟
		// 创建发送短信验证码请求
		const phoneOptions = {
			templateParam: '{"code":"##code##"}',
			signName: '甘意咨询学习',
			templateCode: 'SMS_464040638',
			phoneNumber: '18373169844',
			validTime: expirationTime * 60,
			returnVerifyCode: true,
			codeLength: 6
		};
		console.log('=====================手机参数', phoneOptions);
		const sendSmsVerifyCodeRequest = new $Dypnsapi20170525.SendSmsVerifyCodeRequest(
			phoneOptions
		);

		try {
			// const response = await this.client.sendSmsVerifyCodeWithOptions(
			// 	sendSmsVerifyCodeRequest,
			// 	new $Util.RuntimeOptions({})
			// );
			// console.log('=================成功发送短信的返回数据', response);
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
		let checkSmsVerifyCodeRequest = new $Dypnsapi20170525.CheckSmsVerifyCodeRequest(
			{
				phoneNumber,
				verifyCode
			}
		);
		let runtime = new $Util.RuntimeOptions({});
		try {
			// 复制代码运行请自行打印 API 的返回值
			// const res = await this.client.checkSmsVerifyCodeWithOptions(
			// 	checkSmsVerifyCodeRequest,
			// 	runtime
			// );
			return true;
		} catch (error) {
			// 错误 message
			console.log(error.message);
			// 诊断地址
			console.log(error.data['Recommend']);
			Util.assertAsString(error.message);
			return false;
		}
	}
}
