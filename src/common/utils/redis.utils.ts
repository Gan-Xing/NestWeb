// src/utils/redis.utils.ts

import { ConfigService } from '@nestjs/config';
import { RedisConfig } from 'src/common';

export function createRedisConfigs(
	configService: ConfigService,
	clients: string[]
): Promise<RedisConfig[]> {
	return Promise.resolve(
		clients.map((client) => ({
			name: client,
			host: configService.get<string>(`REDIS_HOST_${client.toUpperCase()}`),
			port: configService.get<number>(`REDIS_PORT_${client.toUpperCase()}`),
			password: configService.get<string>(`REDIS_PASSWORD_${client}`),
			db: configService.get<number>(`REDIS_DB_${client}`)
		}))
	);
}
