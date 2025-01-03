import knex, { Knex } from 'knex';
import { fetchSecret } from '@pocket-tools/lambda-secrets';
import { config } from './config.ts';
import knexServerlessMysql from 'knex-serverless-mysql';
import serverlessMysql from 'serverless-mysql';
import * as mysql2 from 'mysql2';

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

  const mysql = serverlessMysql({
    // @ts-expect-error - serverless-mysql types are incorrect and their doc states to do this.
    // https://github.com/jeremydaly/serverless-mysql?tab=readme-ov-file#consideration-when-using-typescript
    library: mysql2,
    config: {
      host: host,
      port: port,
      user: user,
      password: password,
      database: config.database.dbName,
      charset: 'utf8mb4',
    },
  });

  return knex({
    client: knexServerlessMysql,
    // @ts-expect-error - knex-serverless-mysql types are incorrect and their doc states to do this.
    // https://github.com/MatissJanis/knex-serverless-mysql?tab=readme-ov-file#simple-example
    mysql,
  });
}
