// transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
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
