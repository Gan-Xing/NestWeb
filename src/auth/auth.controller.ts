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
import { Public } from 'src/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto, SignUpFormData, Token } from './dto';
import { ValidateEmailDto } from './dto/validate-token.dto';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
	constructor(private readonly auth: AuthService) {}

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
		@Body() validateEmailDto: ValidateEmailDto
	): Promise<{ isValid: boolean; token?: string; code?: string }> {
		const isValid = await this.auth.validateEmailVerificationCode(
			validateEmailDto.token,
			validateEmailDto.code
		);
		console.log('最终的判断结果', isValid);

		if (isValid) {
			const token = await this.auth.sendSMSVerificationCode(
				validateEmailDto.phone
			);
			return { isValid, token };
		} else {
			return { isValid: false };
		}
	}

	@Public()
	@Post('register')
	@ApiCreatedResponse({ type: Token })
	@ApiBadRequestResponse({ description: 'Invalid request body' })
	async register(@Body() createUserDto: RegisterDto) {
		return this.auth.register(createUserDto);
	}
	@Post('refresh')
	@ApiBearerAuth()
	@ApiCreatedResponse({ description: 'Refresh user token.' })
	async refresh(@Body('refreshToken') { refreshToken }: RefreshTokenDto) {
		return this.auth.refreshToken(refreshToken);
	}
}
