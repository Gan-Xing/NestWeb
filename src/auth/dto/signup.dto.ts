import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';
import { CountryCode } from 'src/common/utils/phone-validation';
import { PhoneNumberValidator } from 'src/common/validators/phone.validator';

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
	country: CountryCode;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Validate(PhoneNumberValidator, ['country'])
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
