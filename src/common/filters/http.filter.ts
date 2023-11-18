import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
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
}
