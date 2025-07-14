/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const dbConfig = {
  type: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  entities: [process.env.DB_ENTITIES_DIRECTORY],
  migrations: [process.env.DB_MIGRATIONS_DIRECTORY],
  synchronize: false, // Disabled to prevent trigger conflicts
  cli: {
    entitiesDir: process.env.CLI_ENTITIES_DIRECTORY,
    migrationsDir: process.env.CLI_MIGRATIONS_DIRECTORY,
  },
  cache: true,
};

module.exports = dbConfig;
