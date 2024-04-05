import knex, { Knex } from 'knex';
import { fetchSecret } from '@pocket-tools/lambda-secrets';
import { config } from './config';

let readDb: Knex;
let writeDb: Knex;

/**
 * Create a db client for reads from readitla_ril-* databases
 */
export async function readClient(
  reset: boolean = false,
): Promise<knex.Knex<any, any[]>> {
  if (readDb && !reset) return readDb;

  const secret = await fetchSecret(config.dbSecretName);

  readDb = createConnection({
    host: secret.read_host,
    port: 3306,
    user: secret.read_username,
    password: secret.read_password,
  });

  return readDb;
}

/**
 * Create a db client for writes to readitla_ril-* databases
 */
export async function writeClient(
  reset: boolean = false,
): Promise<knex.Knex<any, any[]>> {
  if (writeDb && !reset) return writeDb;

  const secret = await fetchSecret(config.dbSecretName);

  writeDb = createConnection({
    host: secret.write_host,
    port: 3306,
    user: secret.write_username,
    password: secret.write_password,
  });

  return writeDb;
}

/**
 * Create a db connection
 * @param dbConfig
 * @param database
 */
export function createConnection(dbConfig: {
  host: string;
  port: number;
  user: string;
  password: string;
}): Knex {
  const { host, port, user, password } = dbConfig;

  return knex({
    client: 'mysql2',
    connection: {
      host: host,
      port: port,
      user: user,
      password: password,
      database: config.database.dbName,
      charset: 'utf8mb4',
    },
    pool: {
      /**
       * Explicitly set the session timezone. We don't want to take any chances with this
       */
      afterCreate: (connection, callback) => {
        connection.query(`SET time_zone = '${config.database.tz}';`, (err) => {
          callback(err, connection);
        });
      },
    },
  });
}
