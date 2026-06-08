import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { StorageModule } from "src/storage/storage.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
