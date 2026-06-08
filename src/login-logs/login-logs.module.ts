import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { LoginLogsController } from "./login-logs.controller";
import { LoginLogsService } from "./login-logs.service";

@Module({
  imports: [PrismaModule],
  controllers: [LoginLogsController],
  providers: [LoginLogsService],
})
export class LoginLogsModule {}
