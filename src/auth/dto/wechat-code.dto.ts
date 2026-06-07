import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class WechatCodeDto {
  @ApiProperty({ description: "WeChat mini-program temporary login code." })
  @IsString()
  @IsNotEmpty()
  code: string;
}
