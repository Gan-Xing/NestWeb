import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class Token {
  @IsString()
  @IsJWT()
  @IsNotEmpty()
  @ApiProperty()
  accessToken: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  accessExpiresIn: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description:
      "Refresh token expiry timestamp in milliseconds. The refresh token itself is stored in an HttpOnly cookie.",
  })
  refreshExpiresIn: number;
}
