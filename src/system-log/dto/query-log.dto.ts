import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLogDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  requestUrl?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
} 