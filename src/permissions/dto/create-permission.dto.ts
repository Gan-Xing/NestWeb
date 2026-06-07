import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, IsOptional } from "class-validator";

export class CreatePermissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  permissionGroupId: number;
}
