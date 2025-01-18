import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfig } from 'src/common';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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

	async set(
		key: string,
		value: any,
		expiry: number = 0,
		compress: boolean = false,
		clientName: string = 'default'
	): Promise<void> {
		const client = this.getClient(clientName);
		let data: string | Buffer;
		
		// 如果value是字符串，直接使用，否则转换为JSON字符串
		if (typeof value === 'string') {
			data = value;
		} else {
			data = JSON.stringify(value);
		}

		if (compress) {
			data = await gzipAsync(data.toString());
		}
		if (expiry > 0) {
			await client.set(key, data, 'EX', expiry);
		} else {
			await client.set(key, data);
		}
	}

	async get(
		key: string,
		decompress: boolean = false,
		clientName: string = 'default'
	): Promise<any> {
		const client = this.getClient(clientName);
		let data: Buffer | string | null = await client.getBuffer(key);
		if (decompress && data) {
			data = await gunzipAsync(data);
		}
		if (data) {
			try {
				return JSON.parse(data.toString());
			} catch (e) {
				return data.toString();
			}
		}
		return null;
	}

	async compareToken(
		key: string,
		newToken: string,
		clientName: string = 'default'
	): Promise<boolean> {
		const client = this.getClient(clientName);
		let storedToken = await client.get(key);

		// 如果 storedToken 是字符串，去除两端的引号
		if (
			typeof storedToken === 'string' &&
			storedToken.startsWith('"') &&
			storedToken.endsWith('"')
		) {
			storedToken = storedToken.substring(1, storedToken.length - 1);
		}

		return storedToken === newToken;
	}
}
