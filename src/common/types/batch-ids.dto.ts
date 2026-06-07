import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class BatchIdsDto {
  @ApiProperty({ isArray: true, type: Number })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
