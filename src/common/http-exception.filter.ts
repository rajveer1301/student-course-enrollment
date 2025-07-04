import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? (exception.getResponse() as any)
      : null;

    const message = isHttpException
      ? exceptionResponse?.message || exception.message
      : 'Internal server error';

    const errorType = isHttpException
      ? exception.constructor.name
      : 'InternalServerError';

    const details = Array.isArray(message) ? message : [message];

    response.status(status).json({
      statusCode: status,
      success: false,
      message: typeof message === 'string' ? message : 'Request failed',
      error: {
        type: errorType,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
