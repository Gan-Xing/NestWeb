import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SystemLogResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  isp: string;

  @ApiProperty()
  requestDescription: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class SystemLogDetailResponseDto extends SystemLogResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  requestUrl: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  status: number;

  @ApiProperty()
  ip: string;

  @ApiPropertyOptional()
  userAgent?: string | null;

  @ApiPropertyOptional()
  requestData?: unknown;

  @ApiPropertyOptional()
  errorMsg?: string | null;
}

export class SystemLogListResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty({ type: [SystemLogResponseDto] })
  data: SystemLogResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
