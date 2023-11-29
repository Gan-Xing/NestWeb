// utils/random.ts
import { randomBytes } from 'crypto';

export class MyRandom {
	/**
	 * Generates a random hexadecimal string.
	 * @param {number} length - Length of the hexadecimal string to be generated.
	 * @returns {string} - A random hexadecimal string.
	 */
	static hex(length: number = 3): string {
		return randomBytes(length).toString('hex');
	}

	// ... 其他随机数生成方法 ...
}
