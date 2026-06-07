import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PermissionTreeNodeEntity {
  @ApiProperty()
  key: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  permissionId?: number;

  @ApiProperty()
  selectable: boolean;

  @ApiPropertyOptional()
  checkable?: boolean;

  @ApiPropertyOptional({ type: () => [PermissionTreeNodeEntity] })
  children?: PermissionTreeNodeEntity[];
}
