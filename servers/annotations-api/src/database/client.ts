import knex, { Knex } from 'knex';
import config from '../config';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

let readDb: Knex;
let writeDb: Knex;
let dynamoDb: DynamoDBClient;

/**
 * Create shared DynamoDB Client. By default, reuses connections.
 * This is because the overhead of creating a new TCP connection
 * for each DynamoDB request might be greater latency than the
 * operation itself.
 * See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
 * @returns DynamoDBClient
 */
export function dynamoClient(): DynamoDBClient {
  if (dynamoDb) return dynamoDb;
  const dynamoClientConfig: DynamoDBClientConfig = {
    region: config.aws.region,
  };
  // Set endpoint for local client, otherwise provider default
  if (config.aws.endpoint != null) {
    dynamoClientConfig['endpoint'] = config.aws.endpoint;
  }
  dynamoDb = new DynamoDBClient(dynamoClientConfig);
  return dynamoDb;
}

/**
 * Create a db client for reads from readitla_ril-tmp
 */
export function readClient(): Knex {
  if (readDb) return readDb;

  readDb = createConnection(config.database.read);

  return readDb;
}

/**
 * Create a db client for writes to readitla_ril-tmp
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
      // knex docs state to set to 0 so that idle connections are released.
      // default was 2 for legacy knex reasons (according to docs)
      min: 0,
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
