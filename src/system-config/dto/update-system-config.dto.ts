import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSystemConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}
