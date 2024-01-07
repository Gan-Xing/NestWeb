import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

import {
	AccessTokenResult,
	GetUnlimitedQRCode,
	MiniProgramService,
	SessionResult,
	WeChatModuleOptions
} from '@ganxing/wechat';
import { Params } from '@alicloud/openapi-client';

@Injectable()
export class WechatService {
	private miniProgramService: MiniProgramService;

	constructor(private configService: ConfigService) {
		const weChatOptions: WeChatModuleOptions = {
			appid: this.configService.get<string>('MINIPROGRAM_APPID'),
			secret: this.configService.get<string>('MINIPROGRAM_SECRET')
		};
		this.miniProgramService = new MiniProgramService(weChatOptions);
	}

	async getMiniProgramAccessToken(): Promise<AxiosResponse<AccessTokenResult>> {
		return await this.miniProgramService.getAccessToken();
	}

	async getUnlimitedMiniProgramiQRCode(
		params: GetUnlimitedQRCode,
		accessToken: string,
		config?: AxiosRequestConfig
	) {
		return await this.miniProgramService.getUnlimitedQRCode(
			params,
			accessToken,
			config
		);
	}

	async getUnionIdByCode(
		code: string,
		appId?: string,
		secret?: string
	): Promise<SessionResult> {
		return await this.miniProgramService.code2Session(code);
	}
}
