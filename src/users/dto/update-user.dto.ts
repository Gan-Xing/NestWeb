import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  IsArray,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_STATUS_VALUES, type UserStatus } from '../constants/user-status';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  password?: string;

  @ApiPropertyOptional({ isArray: true, type: 'number' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roles?: number[]; // 修改为角色ID的数组

  @ApiPropertyOptional({ enum: USER_STATUS_VALUES })
  @IsOptional()
  @IsIn(USER_STATUS_VALUES)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  departmentId?: number;
}
