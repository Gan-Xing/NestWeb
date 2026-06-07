import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "src/redis/redis.service";
import { SmsService } from "src/sms/sms.service";
import { mockProviderFactories } from "../../test/unit-provider-mocks";
import { DiagnosticsService } from "./diagnostics.service";

describe("DiagnosticsService", () => {
  let service: DiagnosticsService;
  let redisService: jest.Mocked<RedisService>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticsService,
        mockProviderFactories.redisService(),
        mockProviderFactories.smsService(),
      ],
    }).compile();

    service = module.get(DiagnosticsService);
    redisService = module.get(RedisService);
    smsService = module.get(SmsService);
  });

  it("checks Redis by writing and reading a short-lived key", async () => {
    let storedValue: unknown;
    redisService.set.mockImplementation(async (_key, value) => {
      storedValue = value;
    });
    redisService.get.mockImplementation(async () => storedValue);

    const result = await service.checkRedis();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("redis");
    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringContaining("diagnostics:redis:"),
      expect.objectContaining({ checkedAt: expect.any(String) }),
      30,
    );
    expect(redisService.get).toHaveBeenCalledWith(
      expect.stringContaining("diagnostics:redis:"),
    );
  });

  it("runs SMS diagnostics through the SMS service without exposing the full phone number", async () => {
    smsService.sendSMSVerificationCode.mockResolvedValue(true);
    smsService.isDryRun.mockReturnValue(true);

    const result = await service.testSms("18373169844");

    expect(result.status).toBe("ok");
    expect(result.service).toBe("sms");
    expect(result.dryRun).toBe(true);
    expect(result.phoneNumber).toBe("183****9844");
    expect(smsService.sendSMSVerificationCode).toHaveBeenCalledWith(
      "18373169844",
    );
  });
});
