import { randomBytes } from '@ganxing/utils';

export const getRandomByte = (size: number = 3) => {
	return randomBytes(size);
};
