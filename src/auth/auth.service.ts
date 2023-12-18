//src/auth/auth.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JwtConfig, MyRandom, SecurityConfig } from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/password/password.service';
import { RedisService } from 'src/redis/redis.service';
import { CaptchaService } from 'src/captcha/captcha.service';
import { EmailService } from 'src/email/email.service';
import { SmsService } from 'src/sms/sms.service';
import { HttpService } from '@nestjs/axios';
import { RegisterDto, SignUpFormData, Token, ValidateTokenDto } from './dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly prisma: PrismaService,
		private readonly passwordService: PasswordService,
		private readonly configService: ConfigService,
		private readonly redisService: RedisService,
		private readonly captchaService: CaptchaService,
		private readonly emailService: EmailService,
		private readonly smsService: SmsService,
		private readonly httpService: HttpService
	) {}

	async exchangeCodeForUserId(code: string): Promise<any> {
		const appid = this.configService.get<string>('MINIPROGRAM_APPID');
		const secret = this.configService.get<string>('MINIPROGRAM_SECRET');
		const url = `https://api.weixin.qq.com/sns/jscode2session`;

		try {
			const response = await this.httpService.axiosRef.get(url, {
				params: {
					appid,
					secret,
					js_code: code,
					grant_type: 'authorization_code'
				}
			});
			return response.data;
			// 这里返回的数据包含 openid 和 unionid（如果有）
		} catch (error) {
			throw new Error('Unable to fetch user info from WeChat');
		}
	}
	// 测试 Redis 的方法
	async testRedis(): Promise<void> {
		// 使用默认客户端
		await this.redisService.set('key1', 'value1');
		const value1 = await this.redisService.get('key1');
		console.log(`Value from default client: ${value1}`);

		// // 使用次要客户端
		// await this.redisService.set('key2', 'value2', 'secondary');
		// const value2 = await this.redisService.get('key2', 'secondary');
		// console.log(`Value from secondary client: ${value2}`);
		// return this.redisClient.get('testKey');
	}
	async validateCaptcha(signupData: SignUpFormData): Promise<{ isValid: boolean }> {
		const { captchaToken, captcha, phoneNumber } = signupData;

		// 使用 CaptchaService 验证验证码
		const isCaptchaValid = await this.captchaService.validateCaptcha(
			captchaToken,
			captcha
		);
		if (isCaptchaValid) {
			await this.redisService.set(
				`userRegistration:${phoneNumber}`,
				signupData,
				60 * 60
			);
			return { isValid: isCaptchaValid };
		} else {
			return { isValid: isCaptchaValid };
		}
	}

	async getUserFromRedis(key: string) {
		const value = await this.redisService.get(key);
		return value;
	}

	async sendEmailVerificationCode(email: string): Promise<string> {
		return await this.emailService.sendEmailVerificationCode(email);
	}

	async validateEmailVerificationCode(token: string, inputCode: string): Promise<boolean> {
		return this.redisService.compareToken(token, inputCode);
	}

	async sendSMSVerificationCode(phone: string): Promise<string> {
		const expirationTime = 15; // 短信验证码有效期，单位为分钟
		const smsToken = MyRandom.hex(3);

		try {
			const res = await this.smsService.sendSMSVerificationCode(phone);

			if (res) {
				const key = `smsVerification:${phone}_${MyRandom.hex(8)}`;
				await this.redisService.set(
					key,
					smsToken,
					expirationTime * 60
				);
				return key;
			} else {
				return 'failed';
			}
		} catch {
			return 'failed';
		}
	}

	async validateSMSVerificationCode(ValidateToken: ValidateTokenDto) {
		return await this.smsService.validateSMSVerificationCode(
			ValidateToken.phone,
			ValidateToken.code
		);
	}

	async register(registerUser: RegisterDto): Promise<Token> {
		// 确保邮箱是唯一的
		const existingEmail = await this.prisma.user.findUnique({
			where: { email: registerUser.email.toLowerCase() }
		});
		if (existingEmail) {
			throw new Error('Email already in use');
		}

		// 确保电话号码是唯一的
		if (registerUser.phoneNumber) {
			const existingPhone = await this.prisma.user.findUnique({
				where: { phoneNumber: registerUser.phoneNumber }
			});
			if (existingPhone) {
				throw new Error('Phone number already in use');
			}
		}

		const hashedPassword = await this.passwordService.hashPassword(
			registerUser.password
		);

		// 设定默认的用户角色
		const defaultRole = await this.prisma.role.findUnique({
			where: { name: 'User' }
		});
		if (!defaultRole) {
			throw new Error('Default role does not exist');
		}

		const user = await this.prisma.user.create({
			data: {
				email: registerUser.email.toLowerCase(),
				password: hashedPassword,
				roles: {
					connect: [{ id: defaultRole.id }] // 连接到默认角色
				},
				status: '1',
				username: registerUser.username,
				// 根据你的业务逻辑设定默认的gender和departmentId
				gender: '1',
				departmentId: 1
			}
		});

		// Return a JWT
		const tokens = await this.generateTokens({ userId: user.id });
		await this.updateRtHash(user.id, tokens.refreshToken);

		return tokens;
	}

	async login(email: string, password: string): Promise<Token> {
		// Step 1: Fetch a user with the given email
		const user = await this.prisma.user.findUnique({
			where: { email: email.toLowerCase() }
		});

		// If no user is found, throw an error
		if (!user) {
			throw new NotFoundException(`No user found for email: ${email}`);
		}

		// Step 2: Check if the password is correct
		const isPasswordValid = await this.passwordService.validatePassword(
			password,
			user.password
		);

		// If password does not match, throw an error
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid password');
		}

		// Step 3: Generate a JWT containing the user's ID and return it
		const tokens = await this.generateTokens({ userId: user.id });
		await this.updateRtHash(user.id, tokens.refreshToken);
		return tokens;
	}

	async logout(userId: number): Promise<boolean> {
		await this.prisma.user.updateMany({
			where: {
				id: userId,
				hashedRt: {
					not: null
				}
			},
			data: {
				hashedRt: null
			}
		});
		return true;
	}

	private generateAccessToken(payload: { userId: number }) {
		const securityConfig = this.configService.get<SecurityConfig>('security');
		const token = this.jwtService.sign(payload);
		const expiresIn = this.convertExpiresInToSeconds(securityConfig.expiresIn);
		return {
			token,
			expiresIn
		};
	}

	private generateRefreshToken(payload: { userId: number }) {
		const securityConfig = this.configService.get<SecurityConfig>('security');
		const jwtConfig = this.configService.get<JwtConfig>('jwt');

		const token = this.jwtService.sign(payload, {
			secret: jwtConfig.refreshSecret,
			expiresIn: securityConfig.refreshIn
		});
		const expiresIn = this.convertExpiresInToSeconds(securityConfig.refreshIn);

		return {
			token,
			expiresIn
		};
	}

	async refreshToken(token: string) {
		const jwtConfig = this.configService.get<JwtConfig>('jwt');
		const { userId } = this.jwtService.verify(token, {
			secret: jwtConfig.refreshSecret
		});
		const user = await this.validateUser(userId);
		const isJwtValid = await this.passwordService.validatePassword(
			token,
			user.hashedRt
		);
		if (!user || !isJwtValid) {
			throw new UnauthorizedException();
		}
		const tokens = await this.generateTokens({ userId });
		await this.updateRtHash(userId, tokens.refreshToken);
		return tokens;
	}

	validateUser(userId: number): Promise<User> {
		return this.prisma.user.findUnique({ where: { id: userId } });
	}

	getUserFromToken(token: string): Promise<User> {
		const id = this.jwtService.decode(token)['userId'];
		return this.prisma.user.findUnique({ where: { id } });
	}

	generateTokens(payload: { userId: number }): Token {
		const accessToken = this.generateAccessToken(payload);
		const refreshToken = this.generateRefreshToken(payload);

		return {
			accessToken: accessToken.token,
			refreshToken: refreshToken.token,
			accessExpiresIn: accessToken.expiresIn,
			refreshExpiresIn: refreshToken.expiresIn
		};
	}

	private async updateRtHash(userId: number, rt: string): Promise<void> {
		const hash = await this.passwordService.hashPassword(rt);
		await this.prisma.user.update({
			where: { id: userId },
			data: { hashedRt: hash }
		});
	}

	convertExpiresInToSeconds(expiresIn: string): number {
		const expiresInNumber = parseInt(expiresIn);
		if (expiresIn.endsWith('s')) {
			return expiresInNumber;
		} else if (expiresIn.endsWith('m')) {
			return expiresInNumber * 60;
		} else if (expiresIn.endsWith('h')) {
			return expiresInNumber * 60 * 60;
		} else if (expiresIn.endsWith('d')) {
			return expiresInNumber * 60 * 60 * 24;
		} else {
			throw new Error(`Unable to parse expiresIn value: ${expiresIn}`);
		}
	}
}
