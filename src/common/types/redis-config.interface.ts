// src/redis/redis-config.interface.ts

export interface RedisConfig {
	name: string;
	host: string;
	port: number;
	password?: string;
	db?: number;
}
