import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Provider } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from 'src/auth/auth.service';
import { CaptchaService } from 'src/captcha/captcha.service';
import { EmailService } from 'src/email/email.service';
import { EmailProducer } from 'src/queue/producers/email.producer';
import { PasswordService } from 'src/password/password.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { SmsService } from 'src/sms/sms.service';
import { UsersService } from 'src/users/users.service';
import { WechatService } from 'src/wechat/wechat.service';

type MockObject = Record<PropertyKey, jest.Mock>;

export function createMockObject(): MockObject {
	const methods: MockObject = {};

	return new Proxy(methods, {
		get(target, property) {
			if (property === 'then') {
				return undefined;
			}

			if (!target[property]) {
				target[property] = jest.fn();
			}

			return target[property];
		}
	});
}

export function createMockProvider(provide: unknown): Provider {
	return {
		provide,
		useValue: createMockObject()
	} as Provider;
}

export function createPrismaMock() {
	return {
		$connect: jest.fn(),
		$disconnect: jest.fn(),
		article: createMockObject(),
		permission: createMockObject(),
		permissionGroup: createMockObject(),
		role: createMockObject(),
		loginLog: createMockObject(),
		user: createMockObject()
	};
}

export function createPrismaProvider(): Provider {
	return {
		provide: PrismaService,
		useValue: createPrismaMock()
	};
}

export function createConfigProvider(): Provider {
	const config: Record<string, unknown> = {
		security: {
			expiresIn: '1d',
			refreshIn: '7d',
			bcryptSaltOrRound: 10
		},
		jwt: {
			accessSecret: 'test-access-secret',
			refreshSecret: 'test-refresh-secret'
		},
		REDIS_CLIENTS: 'default'
	};

	return {
		provide: ConfigService,
		useValue: {
			get: jest.fn((key: string) => config[key] ?? process.env[key])
		}
	};
}

export function createHttpProvider(): Provider {
	return {
		provide: HttpService,
		useValue: {
			axiosRef: {
				get: jest.fn()
			},
			get: jest.fn(),
			post: jest.fn()
		}
	};
}

export function createRedisConfigProvider(): Provider {
	return {
		provide: 'REDIS_CONFIG',
		useValue: []
	};
}

export const mockProviderFactories = {
	authService: () => createMockProvider(AuthService),
	captchaService: () => createMockProvider(CaptchaService),
	configService: createConfigProvider,
	emailProducer: () => createMockProvider(EmailProducer),
	emailService: () => createMockProvider(EmailService),
	httpService: createHttpProvider,
	i18nService: () => createMockProvider(I18nService),
	jwtService: () => createMockProvider(JwtService),
	passwordService: () => createMockProvider(PasswordService),
	prismaService: createPrismaProvider,
	redisConfig: createRedisConfigProvider,
	redisService: () => createMockProvider(RedisService),
	smsService: () => createMockProvider(SmsService),
	usersService: () => createMockProvider(UsersService),
	wechatService: () => createMockProvider(WechatService)
};
