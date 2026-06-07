import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RedisService } from "src/redis/redis.service";

type HealthStatus = "ok" | "error";

type DependencyHealth = {
  status: HealthStatus;
  latencyMs: number;
  error?: string;
};

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  getHello(): string {
    return "Hello World!";
  }

  getHealth() {
    return this.getLiveness();
  }

  getLiveness() {
    return {
      status: "ok",
      service: "nestweb-api",
      check: "liveness",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    // TODO(S1): add RabbitMQ and MinIO probes once their clients expose cheap
    // ping/stat calls in application startup context. Current readiness keeps
    // the deploy gate on mandatory database and Redis dependencies.
    const [database, redis] = await Promise.all([
      this.runDependencyCheck(() => this.checkDatabase()),
      this.runDependencyCheck(() => this.checkRedis()),
    ]);
    const payload = {
      status:
        database.status === "ok" && redis.status === "ok" ? "ok" : "error",
      service: "nestweb-api",
      check: "readiness",
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        redis,
      },
    };

    if (payload.status !== "ok") {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
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

  private async runDependencyCheck(
    check: () => Promise<void>,
  ): Promise<DependencyHealth> {
    const startedAt = performance.now();

    try {
      await check();

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
}
