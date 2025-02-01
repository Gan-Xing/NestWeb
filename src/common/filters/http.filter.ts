import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const contextType = host.getType();
    
    if (contextType === 'http') {
      return this.handleHttpException(exception, host);
    } else if (contextType === 'rpc') {
      return this.handleRpcException(exception, host);
    } else {
      this.logger.error(`Unhandled exception in ${contextType} context:`, exception);
      throw exception;
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      message = exception.getResponse() as string;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(exception.message);
      const prismaMessage = exception.message.replace(/\n/g, '');
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          message = prismaMessage;
          break;
        }
        default:
          break;
      }
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      data: null,
      success: false,
      showType: 2,
    });
  }

  private handleRpcException(exception: unknown, host: ArgumentsHost) {
    this.logger.error('RPC Exception:', {
      error: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
    });
    
    // 对于RPC上下文，我们只记录错误并重新抛出
    throw exception;
  }
}
