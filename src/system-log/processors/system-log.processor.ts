import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemLogData } from '../interfaces/system-log.interface';
import { SYSTEM_LOG_QUEUE, SYSTEM_LOG_CREATE_JOB } from 'src/queue/constants/queue.constants';
@Injectable()
@Processor(SYSTEM_LOG_QUEUE)
export class SystemLogProcessor {
  constructor(private prisma: PrismaService) {}

  @Process(SYSTEM_LOG_CREATE_JOB)
  async handleCreate(job: Job<SystemLogData>) {
    try {
      await this.prisma.systemLog.create({
        data: job.data,
      });
    } catch (error) {
      console.error('Failed to process log:', error);
      throw error;
    }
  }
} 