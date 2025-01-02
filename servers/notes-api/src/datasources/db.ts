import { DB } from '../__generated__/db';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { config } from '../config';

const dialect = (host: string) =>
  new PostgresDialect({
    pool: new Pool({
      database: config.database.dbname,
      host: host,
      user: config.database.username,
      password: config.database.password,
      port: config.database.port,
      max: config.database.maxPool,
    }),
  });

// Readonly
let _roDb: Kysely<DB>;
// Writer
let _db: Kysely<DB>;

const lazyRoDb = (): Kysely<DB> => {
  if (_roDb != null) {
    return _roDb;
  } else {
    _roDb = new Kysely<DB>({
      dialect: dialect(config.database.readHost),
    });
    return _roDb;
  }
};

const lazyWriteDb = (): Kysely<DB> => {
  if (_db != null) {
    return _db;
  } else {
    _db = new Kysely<DB>({
      dialect: dialect(config.database.writeHost),
    });
    return _db;
  }
};

export const roDb = lazyRoDb();
export const db = lazyWriteDb();
