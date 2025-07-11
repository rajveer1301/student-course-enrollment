/* eslint-disable @typescript-eslint/no-var-requires */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
require('dotenv').config();

export const dbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  entities: [process.env.DB_ENTITIES_DIRECTORY],
  synchronize: process.env.MODE === 'local' ? false : false, // Disabled to prevent trigger conflicts
  cache: true,
  logging: process.env.MODE === 'local' ? true : false,
};
