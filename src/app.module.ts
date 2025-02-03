import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Module, OnModuleInit, ValidationPipe,} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver, I18nService} from 'nestjs-i18n';
import {
	Config,
	JwtAuthGuard,
	PermissionsGuard,
	LoggingInterceptor,
	TransformInterceptor,
	HttpFilter,
	initializeRedisClients
} from 'src/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ArticlesModule } from 'src/articles/articles.module';
import { UsersModule } from 'src/users/users.module';
import { PasswordModule } from 'src/password/password.module';
import { RolesModule } from 'src/roles/roles.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { PermissiongroupsModule } from 'src/permissiongroups/permissiongroups.module';
import { MenusModule } from 'src/menus/menus.module';
import { RedisModule } from 'src/redis/redis.module';
import { CaptchaModule } from './captcha/captcha.module';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { WechatModule } from './wechat/wechat.module';
import { StorageModule } from './storage/storage.module';
import { ImagesModule } from './images/images.module';
import { QueueModule } from './queue/queue.module';
import * as path from 'path';
import { PhoneNumberValidator } from './common/validators/phone.validator';

@Module({
	imports: [
		PrismaModule,
		UsersModule,
		AuthModule,
		ArticlesModule,
		PasswordModule,
		RolesModule,
		PermissionsModule,
		PermissiongroupsModule,
		MenusModule,
		StorageModule,
		ImagesModule,
		QueueModule,
		ConfigModule.forRoot({
			isGlobal: true,
			load: [Config]
		}),
		// Redis 模块配置
		RedisModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => {
				const clients = configService
					.get<string>('REDIS_CLIENTS')
					.split(',');
				return initializeRedisClients(configService, clients); // 确保这个调用是异步的
			},
			inject: [ConfigService]
		}),
		CaptchaModule,
		EmailModule,
		SmsModule,
		WechatModule,
		I18nModule.forRoot({
			fallbackLanguage: 'en', // 默认语言
			loaderOptions: {
			  path: path.join(process.cwd(), 'src', 'i18n'), // 使用 process.cwd() 动态定位根目录
			  watch: true, // 监听文件变动
			},
			resolvers: [
			  { use: QueryResolver, options: ['lang'] }, // 支持通过 URL Query 参数指定语言
			  { use: HeaderResolver, options: ['x-custom-lang'] }, // 支持通过 Header 指定语言
			  AcceptLanguageResolver, // 默认支持 Accept-Language 头部
			],
		  }),
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_PIPE,
			useFactory: () => new ValidationPipe({ whitelist: true })
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor
		},
		{
			provide: APP_INTERCEPTOR,
			useFactory: (reflector: Reflector) =>
				new ClassSerializerInterceptor(reflector),
			inject: [Reflector]
		},
		{
			provide: APP_FILTER,
			useClass: HttpFilter
		},
		PhoneNumberValidator
	]
})
export class AppModule {}
