// src/auth/auth.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus, Request, Get } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiCreatedResponse
} from '@nestjs/swagger';
import { Public, RegisterDto, Token } from 'src/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, SignUpFormData, ValidateTokenDto,RegisterByEmailDto } from './dto';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Public()
	@Get('wechat-miniprogram-qrcode')
	async requestQRCode(): Promise<{ qrCodeData: Buffer }> {
		return await this.auth.generateQRCode();
	}

	@Public()
	@Post('exchange-code-for-user')
	@HttpCode(HttpStatus.OK)
	async exchangeCodeForUserId(@Body() body: any): Promise<any> {
		const code = body.code;
		const { openid, session_key, unionid } = await this.auth.exchangeCodeForUserId(
			code
		);

		return await this.auth.exchangeCodeForUserId(code);
	}

	@Public()
	@Post('miniprogram-login')
	@HttpCode(HttpStatus.OK)
	async miniprogramLogin(@Body() body: any): Promise<any> {
		const code = body.code;
		console.log('=============正在登录', code);
		return await this.auth.miniprogramLogin(code);
	}

	@Public()
	@Get('test-redis')
	async testRedis() {
		return this.auth.testRedis();
	}

	@Public()
	@Post('login')
	@ApiOkResponse({ type: Token })
	@ApiBadRequestResponse({ description: 'Invalid request body' })
	@ApiUnauthorizedResponse({ description: 'Invalid password' })
	@ApiNotFoundResponse({ description: 'No user found for email' })
	login(@Body() { email, password }: LoginDto) {
		return this.auth.login(email, password);
	}

	@Post('logout')
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	logout(@Request() req): Promise<boolean> {
		const id = req.user.id;
		return this.auth.logout(id);
	}

	@Public()
	@Post('validateCaptcha')
	@ApiOkResponse({ description: 'Validate captcha and initiate email verification.' })
	async validateCaptchaAndInitiateEmailVerification(
		@Body() signupData: SignUpFormData
	): Promise<{ isValid: boolean; token?: string }> {
		const validationResponse = await this.auth.validateCaptcha(signupData);

		if (validationResponse.isValid) {
			const token = await this.auth.sendEmailVerificationCode(
				signupData.email
			);
			return { isValid: true, token };
		} else {
			return { isValid: false };
		}
	}

	@Public()
	@Post('validateEmail')
	@ApiOkResponse({ description: 'Validate email token and send SMS code.' })
	async validateEmailToken(
		@Body() ValidateTokenDto: ValidateTokenDto
	): Promise<{ isValid: boolean; token?: string; code?: string }> {
		const isValid = await this.auth.validateEmailVerificationCode(
			ValidateTokenDto.token,
			ValidateTokenDto.code
		);
		if (isValid) {
			const token = await this.auth.sendSMSVerificationCode(
				ValidateTokenDto.phone
			);
			return { isValid, token };
		} else {
			return { isValid: false };
		}
	}

	@Public()
	@Post('validateSMS')
	@ApiOkResponse({ description: 'Validate sms token and send Register' })
	async validateSMSToken(
		@Body() ValidateToken: ValidateTokenDto
	): Promise<{ isValid: boolean; token?: Token; code?: string }> {
		const isValid = await this.auth.validateSMSVerificationCode(ValidateToken);

		if (isValid) {
			const userObj = await this.auth.getUserFromRedis(
				`userRegistration:${ValidateToken.phone}`
			);
			const { firstName, lastName, email, password, country, phoneNumber } =
				userObj;
			const newUserObj: RegisterDto = {
				firstName,
				lastName,
				username: lastName + firstName,
				email,
				password,
				country,
				phoneNumber
			};
			const token = await this.auth.register(newUserObj);
			return { isValid, token };
		} else {
			return { isValid: false };
		}
	}

	@Public()
	@Post('testSMS')
	@ApiOkResponse({ description: 'Validate sms token and send Register' })
	async validateSMS(@Body() ValidateTokenDto: ValidateTokenDto) {
		const res = await this.auth.validateSMSVerificationCode(ValidateTokenDto);
		return res;
	}

	@Public()
	@Post('register')
	@ApiCreatedResponse({ type: Token })
	@ApiBadRequestResponse({ description: 'Invalid request body' })
	async register(@Body() createUserDto: RegisterDto) {
		return this.auth.register(createUserDto);
	}

	@Public()
	@Post('refresh')
	@ApiBearerAuth()
	@ApiCreatedResponse({ type: Token, description: 'Refresh user token.' })
	async refresh(@Body() token: RefreshTokenDto) {
		return this.auth.refreshToken(token.refreshToken);
	}

	@Public()
	@Post('registerByEmail')
	@ApiOkResponse({
		description: '验证邮箱验证码，若已存在用户则直接登录，否则创建新用户并登录',
		type: Token,
	})
	async registerByEmail(@Body() body: RegisterByEmailDto) {
		return this.auth.registerByEmail(body);
	}
}
