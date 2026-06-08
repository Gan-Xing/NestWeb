import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from 'src/queue/queue.module';
import { SystemLogController } from './system-log.controller';
import { SystemLogService } from './system-log.service';
import { SystemLogProcessor } from './processors/system-log.processor';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
  ],
  controllers: [SystemLogController],
  providers: [SystemLogService, SystemLogProcessor],
  exports: [SystemLogService],
})
export class SystemLogModule {} 
