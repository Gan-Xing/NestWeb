import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class QueryApprovalRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
  status?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  applicantId?: number;

  @IsOptional()
  @IsString()
  approverRoleCode?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  mine?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  pendingForMe?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;
}
