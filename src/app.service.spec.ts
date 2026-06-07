import { ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

describe('AppService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };
  const redisClient = {
    ping: jest.fn(),
  };
  const redisService = {
    getClient: jest.fn(),
  };
  let service: AppService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    redisClient.ping.mockResolvedValue('PONG');
    redisService.getClient.mockReturnValue(redisClient);
    service = new AppService(prisma as any, redisService as any);
  });

  it('returns liveness without touching dependencies', () => {
    expect(service.getLiveness()).toMatchObject({
      status: 'ok',
      service: 'nestweb-api',
      check: 'liveness',
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(redisService.getClient).not.toHaveBeenCalled();
  });

  it('returns readiness when database and Redis are healthy', async () => {
    await expect(service.getReadiness()).resolves.toMatchObject({
      status: 'ok',
      service: 'nestweb-api',
      check: 'readiness',
      dependencies: {
        database: { status: 'ok' },
        redis: { status: 'ok' },
      },
    });
    expect(redisService.getClient).toHaveBeenCalledWith('default');
  });

  it('rejects readiness when a dependency is down', async () => {
    redisClient.ping.mockRejectedValue(new Error('Redis unavailable'));

    await expect(service.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
