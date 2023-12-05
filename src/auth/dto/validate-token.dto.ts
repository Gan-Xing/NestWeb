import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	token: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	code: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	phone: string;
}
