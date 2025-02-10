import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { SystemLogData } from 'src/system-log/interfaces/system-log.interface';
import { 
  SYSTEM_LOG_QUEUE, 
  SYSTEM_LOG_CREATE_JOB,
  IP_GEO_QUEUE,
  IP_GEO_FETCH_JOB,
  IP_GEO_REDIS_PREFIX,
  IP_GEO_REDIS_TTL 
} from 'src/queue/constants/queue.constants';
import { SKIP_SYSTEM_LOG_KEY } from 'src/common/decorators/skip-system-log.decorator';
import { RedisService } from 'src/redis/redis.service';
import { Logger } from '@nestjs/common';

export interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class SystemLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SystemLogInterceptor.name);

  constructor(
    @InjectQueue(SYSTEM_LOG_QUEUE) private logQueue: Queue,
    @InjectQueue(IP_GEO_QUEUE) private geoQueue: Queue,
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  private getUserDisplayName(user?: User): string {
    if (!user) return 'anonymous';
    return `${user.username || ''}` || 'anonymous';
  }

  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const cfIp = request.headers['cf-connecting-ip'];
  
    let ip = '';
  
    if (cfIp) {
      ip = Array.isArray(cfIp) ? cfIp[0] : cfIp;
    } else if (xForwardedFor) {
      ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    } else {
      ip = request.ip || request.socket.remoteAddress || 'unknown';
    }
  
    // 处理本地开发环境
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      // 可以使用一个公共 IP 用于测试
      ip = '114.114.114.114';  // 或者其他测试用的公网 IP
    }
  
    return ip.trim();
  }

  private isAuthRoute(url: string): boolean {
    return url.startsWith('/api/auth/login') || url.startsWith('/api/auth/registerByEmail');
  }

  private async handleIpGeoLocation(ip: string, isAuthRoute: boolean) {
    const redisKey = `${IP_GEO_REDIS_PREFIX}${ip}`;
    
    // 对于登录/注册请求，直接添加到队列
    if (isAuthRoute) {
      await this.geoQueue.add(IP_GEO_FETCH_JOB, { 
        ip,
        redisKey,
        ttl: IP_GEO_REDIS_TTL
      });
      return;
    }

    // 对于其他请求，先查Redis
    const geoInfo = await this.redisService.get(redisKey);
    if (!geoInfo) {
      // Redis中没有，添加到队列
      await this.geoQueue.add(IP_GEO_FETCH_JOB, { 
        ip,
        redisKey,
        ttl: IP_GEO_REDIS_TTL
      });
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipLog = this.reflector.get<boolean>(
      SKIP_SYSTEM_LOG_KEY,
      context.getHandler(),
    );

    if (skipLog) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const clientIp = this.getClientIp(request);
    const { user, method, originalUrl, headers } = request;

    // 处理IP地理位置信息
    const isAuthRoute = this.isAuthRoute(originalUrl);
    this.handleIpGeoLocation(clientIp, isAuthRoute).catch(error => {
      console.error('Failed to handle IP geolocation:', error);
    });

    // 跳过系统日志相关的请求
    if (originalUrl.startsWith('/api/system-log')) {
      return next.handle();
    }

    // 跳过文件上传等大型请求
    const contentType = headers['content-type'];
    if (contentType?.includes('multipart/form-data')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (responseBody) => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;

          try {
            // 尝试从 Redis 获取地理位置信息
            const redisKey = `${IP_GEO_REDIS_PREFIX}${clientIp}`;
            const locationData = await this.redisService.get(redisKey);

            const logData: SystemLogData = {
              userId: user?.id || null,
              username: this.getUserDisplayName(user),
              requestUrl: originalUrl,
              method: method,
              status: response.statusCode,
              ip: clientIp,
              userAgent: headers['user-agent'],
              duration: duration,
              errorMsg: null,
              ...(locationData && { location: locationData }),
              requestData: {
                headers: this.filterSensitiveHeaders(headers),
                query: request.query,
                language: headers['accept-language'],
              }
            };

            await this.logQueue.add(SYSTEM_LOG_CREATE_JOB, logData);
          } catch (error) {
            console.error('Failed to add log to queue:', error);
          }
        },
        error: async (error) => {
          const duration = Date.now() - startTime;
          try {
            await this.logQueue.add(SYSTEM_LOG_CREATE_JOB, {
              userId: user?.id || null,
              username: this.getUserDisplayName(user),
              requestUrl: originalUrl,
              method: method,
              status: error.status || 500,
              errorMsg: error.message || 'Internal server error',
              ip: clientIp,
              userAgent: headers['user-agent'],
              duration: duration,
            });
          } catch (queueError) {
            console.error('Failed to add error log to queue:', queueError);
          }
        },
      }),
    );
  }

  // 添加辅助方法来过滤敏感头信息
  private filterSensitiveHeaders(headers: any) {
    const filtered = { ...headers };
    // 移除敏感信息
    delete filtered.authorization;
    delete filtered.cookie;
    return filtered;
  }
}