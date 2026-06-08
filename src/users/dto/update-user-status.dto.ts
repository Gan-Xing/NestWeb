import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { USER_STATUS_VALUES, type UserStatus } from "../constants/user-status";

export class UpdateUserStatusDto {
  @ApiProperty({ enum: USER_STATUS_VALUES })
  @IsIn(USER_STATUS_VALUES)
  status: UserStatus;
}
