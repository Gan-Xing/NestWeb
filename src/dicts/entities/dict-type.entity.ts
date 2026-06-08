import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DictItem, DictType } from "@prisma/client";

export class DictTypeEntity implements DictType {
  constructor(partial: Partial<DictTypeEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

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

  @ApiPropertyOptional({ isArray: true })
  items?: DictItem[];
}
