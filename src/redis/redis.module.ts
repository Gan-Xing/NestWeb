import { Module, DynamicModule, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisConfig } from 'src/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({})
export class RedisModule {
	static forRootAsync(options: any): DynamicModule {
		return {
			module: RedisModule,
			imports: options.imports || [],
			providers: [
				{
					provide: 'REDIS_CONFIG',
					useFactory: options.useFactory,
					inject: options.inject || []
				},
				RedisService,
				{
					provide: 'REDIS_CLIENTS',
					useFactory: async (configs: RedisConfig[]) => {
						return configs.map((config) => ({
							provide: `RedisClient_${config.name}`,
							useFactory: () =>
								new Redis(config)
						}));
					},
					inject: ['REDIS_CONFIG']
				}
			],
			exports: [RedisService, 'REDIS_CLIENTS']
		};
	}
}
