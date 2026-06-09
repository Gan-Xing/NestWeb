import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type SystemDependencyStatus = "ok" | "error";

export class SystemDependencyHealthEntity {
  @ApiProperty({ enum: ["ok", "error"] })
  status: SystemDependencyStatus;

  @ApiProperty()
  latencyMs: number;

  @ApiPropertyOptional()
  error?: string;
}

export class QueueStatusEntity {
  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ["ok", "error"] })
  status: SystemDependencyStatus;

  @ApiProperty()
  waiting: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  delayed: number;

  @ApiPropertyOptional()
  error?: string;
}

export class SystemStatusDependenciesEntity {
  @ApiProperty({ type: SystemDependencyHealthEntity })
  database: SystemDependencyHealthEntity;

  @ApiProperty({ type: SystemDependencyHealthEntity })
  redis: SystemDependencyHealthEntity;

  @ApiProperty({ type: SystemDependencyHealthEntity })
  rabbitmq: SystemDependencyHealthEntity;

  @ApiProperty({ type: SystemDependencyHealthEntity })
  minio: SystemDependencyHealthEntity;

  @ApiProperty({ type: SystemDependencyHealthEntity })
  queue: SystemDependencyHealthEntity;
}

export class SystemQueuesEntity {
  @ApiProperty({ enum: ["ok", "error"] })
  status: SystemDependencyStatus;

  @ApiProperty({ type: [QueueStatusEntity] })
  queues: QueueStatusEntity[];

  @ApiProperty()
  totals: Omit<QueueStatusEntity, "name" | "status" | "error">;
}

export class SystemStatusEntity {
  @ApiProperty({ enum: ["ok", "error"] })
  status: SystemDependencyStatus;

  @ApiProperty()
  checkedAt: string;

  @ApiProperty({ type: SystemStatusDependenciesEntity })
  dependencies: SystemStatusDependenciesEntity;
}

export class SystemVersionEntity {
  @ApiProperty()
  service: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  nodeVersion: string;

  @ApiProperty()
  env: string;

  @ApiProperty()
  commitSha: string;

  @ApiProperty()
  buildTime: string;
}
