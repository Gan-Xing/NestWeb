import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appService = {
    getHello: jest.fn(),
    getHealth: jest.fn(),
    getLiveness: jest.fn(),
    getReadiness: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    appService.getHello.mockReturnValue('Hello World!');
    appService.getHealth.mockReturnValue({
      status: 'ok',
      service: 'nestweb-api',
      check: 'liveness',
    });
    appService.getLiveness.mockReturnValue({
      status: 'ok',
      service: 'nestweb-api',
      check: 'liveness',
    });
    appService.getReadiness.mockResolvedValue({
      status: 'ok',
      service: 'nestweb-api',
      check: 'readiness',
      dependencies: {
        database: { status: 'ok', latencyMs: 1 },
        redis: { status: 'ok', latencyMs: 1 },
      },
    });

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return a health payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'nestweb-api',
        check: 'liveness',
      });
    });

    it('should return liveness', () => {
      expect(appController.getLiveness()).toEqual({
        status: 'ok',
        service: 'nestweb-api',
        check: 'liveness',
      });
    });

    it('should return readiness', async () => {
      await expect(appController.getReadiness()).resolves.toEqual({
        status: 'ok',
        service: 'nestweb-api',
        check: 'readiness',
        dependencies: {
          database: { status: 'ok', latencyMs: 1 },
          redis: { status: 'ok', latencyMs: 1 },
        },
      });
    });
  });
});
