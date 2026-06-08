import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DictItem, DictType } from "@prisma/client";

export class DictItemEntity implements DictItem {
  constructor(partial: Partial<DictItemEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  dictTypeId: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  color: string | null;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  dictType?: DictType;
}
