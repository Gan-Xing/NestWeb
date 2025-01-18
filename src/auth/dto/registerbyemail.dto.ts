import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterByEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string; // 邮箱验证token

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string; // 邮箱验证码

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
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: 'Please enter a valid phone number' })
  phoneNumber: string;
} 