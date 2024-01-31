import { PrismaClient } from '.prisma/client';
import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';

export interface BaseContext {
  db: PrismaClient;
  conn: Kysely<DB>;
}
