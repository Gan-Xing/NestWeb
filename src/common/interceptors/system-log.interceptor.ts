import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { SystemLogData } from 'src/system-log/interfaces/system-log.interface';
import { SYSTEM_LOG_QUEUE, SYSTEM_LOG_CREATE_JOB } from 'src/queue/constants/queue.constants';
import { SKIP_SYSTEM_LOG_KEY } from 'src/common/decorators/skip-system-log.decorator';
import axios from 'axios';

export interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class SystemLogInterceptor implements NestInterceptor {
  constructor(
    @InjectQueue(SYSTEM_LOG_QUEUE) private logQueue: Queue,
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
      ip = Array.isArray(cfIp) ? cfIp[0] : cfIp; // ✅ 处理 Cloudflare 头（防止类型错误）
    } else if (xForwardedFor) {
      ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor; // ✅ 处理 X-Forwarded-For 头
    } else {
      ip = request.ip || request.socket.remoteAddress || 'unknown'; // 兜底策略
    }
  
    return ip.trim();
  }

  private async getGeoLocation(ip: string) {
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch IP geolocation:", error);
      return null;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 检查是否有 @SkipLog 装饰器
    const skipLog = this.reflector.get<boolean>(
      SKIP_SYSTEM_LOG_KEY,
      context.getHandler(),
    );

    if (skipLog) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const clientIp = this.getClientIp(request);  // 这里获取 IP
    
    const { user, method, originalUrl, headers } = request;


    // 跳过系统日志相关的请求，避免循环记录
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
          const geoLocation = await this.getGeoLocation(clientIp);
          

          try {
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
            };
            await this.logQueue.add(SYSTEM_LOG_CREATE_JOB, logData);
          } catch (error) {
            console.error('Failed to add log to queue:', error);
          }
        },
        error: async (error) => {
          const duration = Date.now() - startTime;

          try {
            await this.logQueue.add('create', {
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
} 