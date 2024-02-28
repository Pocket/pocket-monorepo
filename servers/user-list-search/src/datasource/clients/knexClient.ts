import knex, { Knex } from 'knex';
import { config } from '../../config';

let db: Knex;
let cDb: Knex;

/**
 * Create a db client for reads from readitla_ril-tmp
 */
export function knexDbClient(): Knex {
  if (db) return db;
  const credentials = JSON.parse(config.mysql.readitla);
  const mysqlConfig = config.mysql as any;

  db = createConnection({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    timezone: mysqlConfig.timezone,
  });
  return db;
}

/**
 * Create a db client for reads from readitla_ril-tmp
 */
export function contentDb(): Knex {
  if (cDb) return cDb;
  const credentials = JSON.parse(config.mysql.content);
  const mysqlConfig = config.mysql as any;

  cDb = createConnection({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    timezone: mysqlConfig.timezone,
  });
  return cDb;
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
  database: string;
  timezone: string;
}): Knex {
  const { host, port, user, password, database, timezone } = dbConfig;
  return knex({
    client: 'mysql2',
    connection: {
      host: host,
      port: parseInt(port),
      user: user,
      password: password,
      database: database,
      charset: 'utf8mb4',
    },
    pool: {
      /**
       * Explicitly set the session timezone. We don't want to take any chances with this
       */
      afterCreate: (connection, callback) => {
        connection.query(`SET time_zone = '${timezone}';`, (err) => {
          callback(err, connection);
        });
      },
    },
  });
}
