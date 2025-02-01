import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

type ContextType = 'http' | 'rmq' | 'rpc' | 'ws' | 'graphql';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType<ContextType>();
    
    // 根据不同的上下文类型进行处理
    switch (contextType) {
      case 'http':
        return this.handleHttpLogging(context, next);
      case 'rmq':
        return this.handleRmqLogging(context, next);
      case 'rpc':
      case 'ws':
      case 'graphql':
        this.logger.debug(`Skipping standard logging for ${contextType} context`);
        return next.handle();
      default:
        this.logger.warn(`Unknown context type: ${contextType}, skipping logging`);
        return next.handle();
    }
  }

  private handleHttpLogging(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    const user = req.user ? req.user : 'Anonymous';

    // Log the request
    this.logger.log(`User ${user} Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      // Handle successful requests
      tap(() => {
        const handlingTime = Date.now() - now;
        const status = res.statusCode;
        this.logger.log(
          `User ${user} Outgoing response: ${method} ${url} Status: ${status} Handled within ${handlingTime}ms`,
        );
      }),
      // Handle errors
      catchError((err) => {
        this.logger.error(
          `User ${user} Error processing request: ${method} ${url}`,
          err.stack,
        );
        return throwError(err);
      }),
    );
  }

  private handleRmqLogging(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const now = Date.now();
    const messagePattern = context.getArgByIndex(0);
    const messageId = messagePattern?.properties?.messageId || 'unknown';

    this.logger.debug(`Processing RMQ message: ${messageId}`);

    return next.handle().pipe(
      tap(() => {
        const handlingTime = Date.now() - now;
        this.logger.debug(
          `Completed processing RMQ message: ${messageId} (took ${handlingTime}ms)`,
        );
      }),
      catchError((err) => {
        this.logger.error(
          `Error processing RMQ message: ${messageId}`,
          err.stack,
        );
        return throwError(err);
      }),
    );
  }
}
