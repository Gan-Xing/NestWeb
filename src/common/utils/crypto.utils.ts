import { randomBytes } from 'ganxing';

export const getRandomByte = (size: number = 3) => {
	return randomBytes(size);
};
