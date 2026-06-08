import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsString,
	IsEmail,
	IsNotEmpty,
	IsInt,
	IsArray,
	MinLength,
	IsIn,
	IsOptional
	// IsBoolean,
} from 'class-validator';
import { USER_STATUS_VALUES, type UserStatus } from '../constants/user-status';

export class CreateUserDto {
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

	@ApiPropertyOptional({ enum: USER_STATUS_VALUES })
	@IsOptional()
	@IsIn(USER_STATUS_VALUES)
	status?: UserStatus;

	@ApiProperty()
	avatar: string;

	@ApiProperty()
	@IsNotEmpty()
	gender: string;

	@ApiProperty()
	isAdmin: boolean;

	@ApiProperty()
	// @IsInt()
	// @IsNotEmpty()
	departmentId: number;

	@ApiProperty({ isArray: true, type: 'number' }) // 修改为角色 ID 数组
	@IsArray()
	@IsInt({ each: true }) // 确保每个元素都是一个整数
	roles: number[]; // 修改为数字数组，表示角色ID
}
