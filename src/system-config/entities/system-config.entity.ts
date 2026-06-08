import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SystemConfig } from "@prisma/client";

export class SystemConfigEntity implements SystemConfig {
  constructor(partial: Partial<SystemConfigEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  valueType: string;

  @ApiProperty()
  group: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  editable: boolean;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  sort: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
