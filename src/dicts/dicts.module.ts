import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { DictsController } from "./dicts.controller";
import { DictsService } from "./dicts.service";

@Module({
  imports: [PrismaModule],
  controllers: [DictsController],
  providers: [DictsService],
  exports: [DictsService],
})
export class DictsModule {}
