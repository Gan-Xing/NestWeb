import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SignUpFormData {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@MinLength(6)
	@IsNotEmpty()
	password: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	confirmPassword: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	country: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Matches(/^1[3-9]\d{9}$/, { message: 'Please enter a valid phone number' })
	phoneNumber: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	captcha: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	captchaToken: string;
}
