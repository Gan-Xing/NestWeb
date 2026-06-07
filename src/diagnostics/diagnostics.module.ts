import { Module } from "@nestjs/common";
import { SmsModule } from "src/sms/sms.module";
import { DiagnosticsController } from "./diagnostics.controller";
import { DiagnosticsService } from "./diagnostics.service";

@Module({
  imports: [SmsModule],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
})
export class DiagnosticsModule {}
