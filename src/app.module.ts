import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
		WechatModule
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
		}
	]
})
export class AppModule {}
