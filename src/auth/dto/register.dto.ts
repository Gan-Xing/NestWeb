import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	username: string;

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@MinLength(6)
	@IsNotEmpty()
	password: string;

	@ApiPropertyOptional() // 使用 ApiPropertyOptional 而不是 ApiProperty
	@IsOptional() // 添加 IsOptional 装饰器
	@IsString()
	country?: string; // 使用 ? 使属性变为可选

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Matches(/^1[3-9]\d{9}$/, { message: 'Please enter a valid phone number' })
	phoneNumber: string;

	@ApiPropertyOptional() // 使用 ApiPropertyOptional 而不是 ApiProperty
	@IsOptional() // 添加 IsOptional 装饰器
	@IsString()
	firstName?: string;

	@ApiPropertyOptional() // 使用 ApiPropertyOptional 而不是 ApiProperty
	@IsOptional() // 添加 IsOptional 装饰器
	@IsString()
	lastName?: string;
}
