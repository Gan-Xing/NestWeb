// email.module.ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service'; // 确保正确引用了 EmailService

@Module({
	providers: [EmailService],
	exports: [EmailService]
})
export class EmailModule {}
