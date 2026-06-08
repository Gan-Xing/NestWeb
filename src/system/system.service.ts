import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";
import { Queue } from "bull";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";
import { IStorageService } from "src/storage/storage.interface";
import {
  IP_GEO_QUEUE,
  SYSTEM_LOG_QUEUE,
} from "src/queue/constants/queue.constants";
import {
  QueueStatusEntity,
  SystemDependencyHealthEntity,
  SystemQueuesEntity,
  SystemStatusEntity,
  SystemVersionEntity,
} from "./entities/system-status.entity";

const DEPENDENCY_CHECK_TIMEOUT_MS = 2500;

@Injectable()
export class SystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly amqpConnection: AmqpConnection,
    @Inject("IStorageService")
    private readonly storageService: IStorageService,
    @InjectQueue(SYSTEM_LOG_QUEUE)
    private readonly systemLogQueue: Queue,
    @InjectQueue(IP_GEO_QUEUE)
    private readonly ipGeoQueue: Queue,
  ) {}

  async getStatus(): Promise<SystemStatusEntity> {
    const [database, redis, rabbitmq, minio, queue] = await Promise.all([
      this.runDependencyCheck(() => this.checkDatabase()),
      this.runDependencyCheck(() => this.checkRedis()),
      this.runDependencyCheck(() => this.checkRabbitMQ()),
      this.runDependencyCheck(() => this.storageService.checkHealth()),
      this.runDependencyCheck(() => this.checkQueues()),
    ]);
    const dependencies = { database, redis, rabbitmq, minio, queue };
    const status = Object.values(dependencies).every(
      (dependency) => dependency.status === "ok",
    )
      ? "ok"
      : "error";

    return {
      status,
      checkedAt: new Date().toISOString(),
      dependencies,
    };
  }

  getVersion(): SystemVersionEntity {
    return {
      service: "nestweb-api",
      version: this.readPackageVersion(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV ?? "development",
      commitSha:
        process.env.COMMIT_SHA ?? process.env.GIT_COMMIT ?? "unknown",
      buildTime:
        process.env.BUILD_TIME ?? process.env.BUILD_DATE ?? "unknown",
    };
  }

  async getQueues(): Promise<SystemQueuesEntity> {
    const queues = await Promise.all([
      this.getQueueStatus(this.systemLogQueue),
      this.getQueueStatus(this.ipGeoQueue),
    ]);
    const totals = queues.reduce(
      (acc, queue) => ({
        waiting: acc.waiting + queue.waiting,
        active: acc.active + queue.active,
        completed: acc.completed + queue.completed,
        failed: acc.failed + queue.failed,
        delayed: acc.delayed + queue.delayed,
      }),
      {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      },
    );

    return {
      status: queues.every((queue) => queue.status === "ok") ? "ok" : "error",
      queues,
      totals,
    };
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis() {
    const client = this.redisService.getClient("default");

    if (!client) {
      throw new Error("Default Redis client is not configured");
    }

    await client.ping();
  }

  private async checkRabbitMQ() {
    if (!this.amqpConnection.connected) {
      throw new Error("RabbitMQ connection is not ready");
    }
  }

  private async checkQueues() {
    const queues = await this.getQueues();

    if (queues.status !== "ok") {
      throw new Error("One or more Bull queues are not healthy");
    }
  }

  private async getQueueStatus(queue: Queue): Promise<QueueStatusEntity> {
    try {
      const counts = await this.withTimeout(
        queue.getJobCounts(),
        `${queue.name} queue status timed out`,
      );

      return {
        name: queue.name,
        status: "ok",
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      };
    } catch (error) {
      return {
        name: queue.name,
        status: "error",
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        error: error instanceof Error ? error.message : "Unknown queue error",
      };
    }
  }

  private async runDependencyCheck(
    check: () => Promise<void>,
  ): Promise<SystemDependencyHealthEntity> {
    const startedAt = performance.now();

    try {
      await this.withTimeout(check(), "Dependency check timed out");

      return {
        status: "ok",
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      return {
        status: "error",
        latencyMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private readPackageVersion() {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), "package.json"), "utf8"),
      ) as { version?: string };

      return packageJson.version ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  private withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(message)),
        DEPENDENCY_CHECK_TIMEOUT_MS,
      );

      promise
        .then((value) => {
          clearTimeout(timeout);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}
