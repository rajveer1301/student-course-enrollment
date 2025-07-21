/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const messages = (exception.getResponse() as any)?.message || [];
    // @ts-ignore
    response.status(status as number).json({
      status_code: status,
      data: null,
      message: Array.isArray(messages) ? messages[0] : messages,
      error_messages: Array.isArray(messages) ? messages : [messages],
      error: true,
    });
  }
}
