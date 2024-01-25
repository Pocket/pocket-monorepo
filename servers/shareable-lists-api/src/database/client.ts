import { PrismaClient } from '.prisma/client';
import { serverLogger } from '@pocket-tools/ts-logger';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';
import { DB } from '.kysely/client/types';
import config from '../config';

let kysely: Kysely<DB>;

/**
 * Kysely query builder for more control
 * @returns Kysely query builder
 */
export function db(): Kysely<DB> {
  if (kysely) return kysely;
  const dialect = new MysqlDialect({
    pool: createPool({
      database: config.database.dbname,
      host: config.database.host,
      user: config.database.username,
      password: config.database.password,
      port: config.database.port,
      connectionLimit: 10,
    }),
  });
  return new Kysely<DB>({
    dialect,
  });
}

let prisma;

export function client(): PrismaClient {
  if (prisma) return prisma;

  prisma = new PrismaClient({
    log: [
      {
        level: 'error',
        emit: 'event',
      },
      {
        level: 'warn',
        emit: 'event',
      },
      {
        level: 'info',
        emit: 'event',
      },
      {
        level: 'query',
        emit: 'event',
      },
    ],
  });

  prisma.$on('error', (e) => {
    e.source = 'prisma';
    serverLogger.error(e);
  });

  prisma.$on('warn', (e) => {
    e.source = 'prisma';
    serverLogger.warn(e);
  });

  prisma.$on('info', (e) => {
    e.source = 'prisma';
    serverLogger.info(e);
  });

  prisma.$on('query', (e) => {
    e.source = 'prisma';
    serverLogger.debug(e);
  });

  return prisma;
}
