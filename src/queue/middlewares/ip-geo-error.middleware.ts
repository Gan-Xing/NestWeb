import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Injectable()
export class IpGeoErrorMiddleware {
  private readonly logger = new Logger(IpGeoErrorMiddleware.name);

  async handler(job: Job, err: Error): Promise<void> {
    this.logger.error(
      `Failed to process IP geolocation job ${job.id} for IP ${job.data.ip}`,
      {
        error: err.message,
        stack: err.stack,
        attempts: job.attemptsMade,
        data: job.data
      }
    );

    // 如果达到最大重试次数，记录最终失败
    if (job.attemptsMade >= job.opts.attempts) {
      this.logger.error(
        `IP geolocation job ${job.id} finally failed after ${job.attemptsMade} attempts`
      );
    }
  }
} 