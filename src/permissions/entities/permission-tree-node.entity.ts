import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PermissionTreeNodeEntity {
  @ApiProperty()
  key: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  permissionId?: number;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  action?: string;

  @ApiPropertyOptional()
  path?: string;

  @ApiProperty()
  selectable: boolean;

  @ApiPropertyOptional()
  checkable?: boolean;

  @ApiPropertyOptional({ type: () => [PermissionTreeNodeEntity] })
  children?: PermissionTreeNodeEntity[];
}
