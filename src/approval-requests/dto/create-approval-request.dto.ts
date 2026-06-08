import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateApprovalRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  businessType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessId?: string;

  @ApiProperty({ enum: ["USER", "ROLE"] })
  @IsIn(["USER", "ROLE"])
  approverType: "USER" | "ROLE";

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateApprovalRequestDto) => dto.approverType === "USER")
  @IsInt()
  approverUserId?: number;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateApprovalRequestDto) => dto.approverType === "ROLE")
  @IsString()
  @IsNotEmpty()
  approverRoleCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
