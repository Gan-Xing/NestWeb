// transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ContextType = 'http' | 'rmq' | 'rpc' | 'ws' | 'graphql';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const contextType = context.getType<ContextType>();
    
    // 根据不同的上下文类型进行处理
    switch (contextType) {
      case 'http':
        return this.handleHttpResponse(context, next);
      case 'rmq':
      case 'rpc':
      case 'ws':
      case 'graphql':
        this.logger.debug(`Skipping response transform for ${contextType} context`);
        return next.handle();
      default:
        this.logger.warn(`Unknown context type: ${contextType}, skipping response transform`);
        return next.handle();
    }
  }

  private handleHttpResponse(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
        message: 'Operation successful',
        data,
        success: true,
        showType: 0,
      })),
    );
  }
}

export interface Response<T> {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  data: T;
  success: boolean;
  showType: number;
}
