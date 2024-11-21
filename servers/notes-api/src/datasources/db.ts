import { DB } from '../__generated__/db';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { config } from '../config';

const dialect = new PostgresDialect({
  pool: new Pool({
    database: config.database.dbname,
    host: config.database.host,
    user: config.database.username,
    password: config.database.password,
    port: config.database.port,
    max: config.database.maxPool,
  }),
});

let _db: Kysely<DB>;
const lazyDb = (): Kysely<DB> => {
  if (_db != null) {
    return _db;
  } else {
    _db = new Kysely<DB>({
      dialect,
    });
    return _db;
  }
};

export const db = lazyDb();
