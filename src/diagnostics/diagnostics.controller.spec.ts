import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { createMockProvider } from "../../test/unit-provider-mocks";
import { DiagnosticsController } from "./diagnostics.controller";
import { DiagnosticsService } from "./diagnostics.service";

describe("DiagnosticsController", () => {
  let controller: DiagnosticsController;
  let diagnosticsService: jest.Mocked<DiagnosticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticsController],
      providers: [createMockProvider(DiagnosticsService)],
    }).compile();

    controller = module.get(DiagnosticsController);
    diagnosticsService = module.get(DiagnosticsService);
  });

  it("requires admin privileges for Redis diagnostics", () => {
    expect(() => controller.checkRedis(false)).toThrow(ForbiddenException);
  });

  it("requires admin privileges for SMS diagnostics", () => {
    expect(() =>
      controller.testSms(false, { phoneNumber: "18373169844" }),
    ).toThrow(ForbiddenException);
  });

  it("delegates Redis diagnostics for admin users", async () => {
    diagnosticsService.checkRedis.mockResolvedValue({ status: "ok" } as any);

    await expect(controller.checkRedis(true)).resolves.toEqual({
      status: "ok",
    });
  });
});
