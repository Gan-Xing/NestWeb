import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfig } from '../common/types/redis-config.interface';

@Injectable()
export class RedisService {
	private clients: { [name: string]: Redis } = {};

	constructor(@Inject('REDIS_CONFIG') private configs: RedisConfig[]) {
		configs.forEach((config) => {
			this.clients[config.name] = new Redis(config);
		});
	}

	getClient(name: string = 'default'): Redis {
		return this.clients[name];
	}

	async set(key: string, value: string, clientName: string = 'default'): Promise<void> {
		const client = this.getClient(clientName);
		await client.set(key, value);
	}

	async get(key: string, clientName: string = 'default'): Promise<string | null> {
		const client = this.getClient(clientName);
		return client.get(key);
	}
}
