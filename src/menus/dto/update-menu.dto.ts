import { PartialType } from "@nestjs/mapped-types";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";
import { CreateMenuDto } from "./create-menu.dto";

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
