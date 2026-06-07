import { ApiProperty } from "@nestjs/swagger";

class DashboardHealthEntity {
  @ApiProperty()
  status: string;

  @ApiProperty()
  service: string;

  @ApiProperty()
  timestamp: string;
}

class DashboardMetricsEntity {
  @ApiProperty({ nullable: true, type: Number })
  users: number | null;

  @ApiProperty({ nullable: true, type: Number })
  roles: number | null;

  @ApiProperty({ nullable: true, type: Number })
  images: number | null;

  @ApiProperty({ nullable: true, type: Number })
  logs: number | null;
}

class DashboardRecentLogEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  requestDescription: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class DashboardSummaryEntity {
  @ApiProperty({ type: DashboardHealthEntity })
  health: DashboardHealthEntity;

  @ApiProperty({ type: DashboardMetricsEntity })
  metrics: DashboardMetricsEntity;

  @ApiProperty({ type: [DashboardRecentLogEntity] })
  recentLogs: DashboardRecentLogEntity[];
}
