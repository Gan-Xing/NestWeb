import { Module } from '@nestjs/common';
import { PhotoLogsController } from './photo-logs.controller';
import { PhotoLogsService } from './photo-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PhotoLogsController],
  providers: [PhotoLogsService],
  exports: [PhotoLogsService],
})
export class PhotoLogsModule {} 