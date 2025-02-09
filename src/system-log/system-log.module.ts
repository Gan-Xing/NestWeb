import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogController } from './system-log.controller';
import { SystemLogService } from './system-log.service';
import { SystemLogProcessor } from './processors/system-log.processor';
import { SYSTEM_LOG_QUEUE } from 'src/queue/constants/queue.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: SYSTEM_LOG_QUEUE,
    }),
  ],
  controllers: [SystemLogController],
  providers: [SystemLogService, SystemLogProcessor],
  exports: [SystemLogService, BullModule],
})
export class SystemLogModule {} 