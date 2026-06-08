import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { QueueModule } from "src/queue/queue.module";
import { StorageModule } from "src/storage/storage.module";
import { SystemController } from "./system.controller";
import { SystemService } from "./system.service";

@Module({
  imports: [PrismaModule, QueueModule, StorageModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
