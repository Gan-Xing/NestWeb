import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class QueryMessageDto {
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
  @IsIn(["notification", "todo", "NOTIFICATION", "TODO"])
  type?: string;

  @IsOptional()
  @IsIn([
    "system",
    "security",
    "approval",
    "task",
    "custom",
    "SYSTEM",
    "SECURITY",
    "APPROVAL",
    "TASK",
    "CUSTOM",
  ])
  category?: string;

  @IsOptional()
  @IsIn(["unread", "read", "pending", "done", "cancelled"])
  state?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsIn(["mine", "all"])
  scope?: string;
}
