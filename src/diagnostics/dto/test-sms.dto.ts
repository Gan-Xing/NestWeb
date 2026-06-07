import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TestSmsDto {
  @ApiProperty({ description: "Phone number used for the SMS provider check." })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
