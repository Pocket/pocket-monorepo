import knex, { Knex } from 'knex';
import { config } from '../config';
import Stripe from 'stripe';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';

let readDb: Knex;
let writeDb: Knex;
let stripe: Stripe;
let eventBridge: PocketEventBridgeClient;

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

export function eventBridgeClient(): PocketEventBridgeClient {
  if (eventBridge) return eventBridge;
  eventBridge = new PocketEventBridgeClient({
    aws: {
      endpoint: config.aws.endpoint,
      region: config.aws.region,
      maxAttempts: config.aws.maxRetries,
    },
    eventBus: { name: config.aws.eventBus.name },
  });
  return eventBridge;
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
