import knex, { Knex } from 'knex';
import config from '../config';

let readDb: Knex;
let writeDb: Knex;

/**
 * Create a db client for reads
 */
export function readClient(): Knex {
  if (readDb) return readDb;

  readDb = createConnection(config.database.read);

  return readDb;
}

/**
 * Create a db client for writes
 */
export function writeClient(): Knex {
  if (writeDb) return writeDb;

  writeDb = createConnection(config.database.write);

  return writeDb;
}

/**
 * Create a db connection
 * @param dbConfig
 */
export function createConnection(dbConfig: {
  host: string;
  port: string;
  user: string;
  password: string;
}): Knex {
  const { host, port, user, password } = dbConfig;

  return knex({
    client: 'mysql',
    connection: {
      host: host,
      port: parseInt(port),
      user: user,
      password: password,
      database: config.database.dbName,
    },
    pool: {
      min: 0, //knex docs state to set to 0 so that idle connections are released. Default was 2 for legacy knex reasons (according to docs)
      max: 10, //knex default
    },
  });
}
