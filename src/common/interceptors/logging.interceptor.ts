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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
}
