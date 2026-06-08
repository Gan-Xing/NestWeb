import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { SystemConfigController } from "./system-config.controller";
import { SystemConfigService } from "./system-config.service";

@Module({
  imports: [PrismaModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
})
export class SystemConfigModule {}
