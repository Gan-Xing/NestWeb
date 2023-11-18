import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';

@Module({
  providers: [PasswordService],
  exports: [PasswordService], // 在这里导出PasswordService
})
export class PasswordModule {}
