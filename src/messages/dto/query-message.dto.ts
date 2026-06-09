import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { MessageCategory, MessageType } from "@prisma/client";

export class QueryMessageDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    enum: [...Object.values(MessageType), "notification", "todo"],
  })
  @IsOptional()
  @IsIn(["notification", "todo", "NOTIFICATION", "TODO"])
  type?: string;

  @ApiPropertyOptional({
    enum: [
      ...Object.values(MessageCategory),
      "system",
      "security",
      "approval",
      "task",
      "custom",
    ],
  })
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

  @ApiPropertyOptional({ enum: ["unread", "read", "pending", "done", "cancelled"] })
  @IsOptional()
  @IsIn(["unread", "read", "pending", "done", "cancelled"])
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ enum: ["mine", "all"] })
  @IsOptional()
  @IsIn(["mine", "all"])
  scope?: string;
}
