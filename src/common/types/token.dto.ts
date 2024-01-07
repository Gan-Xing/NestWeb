import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Token {
  @IsString()
  @IsJWT()
  @IsNotEmpty()
  @ApiProperty()
  accessToken: string;

  @IsString()
  @IsJWT()
  @IsNotEmpty()
  @ApiProperty()
  refreshToken: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  accessExpiresIn: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  refreshExpiresIn: number;
}
