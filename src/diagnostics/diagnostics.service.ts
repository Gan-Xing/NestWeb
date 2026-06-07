import { Injectable } from "@nestjs/common";
import { RedisService } from "src/redis/redis.service";
import { SmsService } from "src/sms/sms.service";

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly redisService: RedisService,
    private readonly smsService: SmsService,
  ) {}

  async checkRedis() {
    const startedAt = Date.now();
    const checkedAt = new Date().toISOString();
    const key = `diagnostics:redis:${startedAt}`;

    await this.redisService.set(key, { checkedAt }, 30);
    const storedValue = await this.redisService.get(key);
    const ok = storedValue?.checkedAt === checkedAt;

    return {
      status: ok ? "ok" : "error",
      service: "redis",
      client: "default",
      latencyMs: Date.now() - startedAt,
      checkedAt,
    };
  }

  async testSms(phoneNumber: string) {
    const startedAt = Date.now();
    const sent = await this.smsService.sendSMSVerificationCode(phoneNumber);

    return {
      status: sent ? "ok" : "error",
      service: "sms",
      provider: "aliyun-dypns",
      dryRun: this.smsService.isDryRun(),
      phoneNumber: maskPhoneNumber(phoneNumber),
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  }
}

function maskPhoneNumber(phoneNumber: string) {
  if (phoneNumber.length <= 7) {
    return "***";
  }

  return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`;
}
