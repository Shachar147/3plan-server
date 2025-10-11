import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseConfig } from './app.config';

const dbConfig = getDatabaseConfig();

const url = dbConfig.url;

export const typeOrmConfig: TypeOrmModuleOptions = url ? {
  type: dbConfig.type as any,
  url,
  autoLoadEntities: true, // ✅ easiest way
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: dbConfig.synchronize,
  extra: dbConfig.extra,
} : {
  type: dbConfig.type as any,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: dbConfig.synchronize,
  extra: dbConfig.extra,
};
