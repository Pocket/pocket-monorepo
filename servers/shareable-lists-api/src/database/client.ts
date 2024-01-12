import { PrismaClient } from '@prisma/client';
import { serverLogger } from '../express';

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
