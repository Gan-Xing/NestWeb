// email.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service'; // 确保正确引用了 EmailService
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
	imports: [
		RedisModule,
		forwardRef(() => QueueModule),
	],
	providers: [EmailService],
	exports: [EmailService]
})
export class EmailModule {}
