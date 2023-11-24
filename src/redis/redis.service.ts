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
		let data: string | Buffer = JSON.stringify(value);
		if (compress) {
			data = await gzipAsync(data); // data 保留为 Buffer 类型
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
		return data ? JSON.parse(data.toString()) : null;
	}
}
