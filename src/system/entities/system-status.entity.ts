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

  @ApiProperty()
  dependencies: {
    database: SystemDependencyHealthEntity;
    redis: SystemDependencyHealthEntity;
    rabbitmq: SystemDependencyHealthEntity;
    minio: SystemDependencyHealthEntity;
    queue: SystemDependencyHealthEntity;
  };
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
