import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ResponseTransformerInterceptor } from './common/response-transformer.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: function (origin, callback) {
      callback(null, true);
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const mode = configService.get('MODE');
  addGlobalMiddlewares(app);
  setupDocumentation(app);
  performStartupOperations();
  await app.listen(port).then(() => {
    console.log(`Started application in ${mode} mode on port ${port}`);
  });
}

/**
 * add nest middlewares here
 */
function addGlobalMiddlewares(app: INestApplication) {
  // setup validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      // this will allow us to get params and query fields as required types
      transform: true,
      // whitelist: true
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformerInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());
}

/**
 * setup swagger documentation
 * @param app
 */
function setupDocumentation(app: INestApplication) {
  const documentationConfig = new DocumentBuilder()
    .setTitle('Student Course Enrollment')
    .setDescription('APIs for Student Course Enrollment')
    .setVersion('1.0')
    .addTag('APIs')
    .build();
  const document = SwaggerModule.createDocument(app, documentationConfig);
  SwaggerModule.setup('docs', app, document);
}

/**
 * other startup operations
 */
function performStartupOperations() {
  //create a temp directory
  try {
    // check if temp directory exists, if not, create it
    const tempDirPath = 'tmp';
    if (!fs.existsSync(tempDirPath)) {
      console.log(`tmp directory not found, creating one`);
      fs.mkdirSync(tempDirPath);
    }
  } catch (e) {
    console.error(`Error while creating temp directory`, e);
  }
}

bootstrap();

process.on('unhandledRejection', (reason, p) => {
  console.log('unhandled Rejection', reason, p);
});

process.on('uncaughtException', (err) => {
  console.log('uncaught Exception', err);
});
