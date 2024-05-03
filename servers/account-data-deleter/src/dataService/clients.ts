import knex, { Knex } from 'knex';
import { config } from '../config/index.js';
import Stripe from 'stripe';

let readDb: Knex;
let writeDb: Knex;
let stripe: Stripe;

/**
 * Create a stripe client for handling Stripe data
 */
export function stripeClient(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(config.stripe.key, {
    apiVersion: config.stripe.apiVersion,
  });
  return stripe;
}

/**
 * Create a db client for reads from readitla_ril-* databases
 */
export function readClient(): Knex {
  if (readDb) return readDb;

  readDb = createConnection(config.database.read);

  return readDb;
}

/**
 * Create a db client for writes to readitla_ril-* databases
 */
export function writeClient(): Knex {
  if (writeDb) return writeDb;

  writeDb = createConnection(config.database.write);

  return writeDb;
}

/**
 * Create a db connection
 * @param dbConfig
 * @param database
 */
export function createConnection(dbConfig: {
  host: string;
  port: string;
  user: string;
  password: string;
}): Knex {
  const { host, port, user, password } = dbConfig;

  return knex({
    client: 'mysql2',
    connection: {
      host: host,
      port: parseInt(port),
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
