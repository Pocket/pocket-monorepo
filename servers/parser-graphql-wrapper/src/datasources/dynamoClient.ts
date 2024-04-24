import config from '../config';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
let dynamoDb: DynamoDBDocumentClient;

/**
 * Create shared DynamoDB Client. By default, reuses connections.
 * This is because the overhead of creating a new TCP connection
 * for each DynamoDB request might be greater latency than the
 * operation itself.
 * See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
 * @returns DynamoDBClient
 */
export function dynamoClient(): DynamoDBDocumentClient {
  if (dynamoDb) return dynamoDb;
  const dynamoClientConfig: DynamoDBClientConfig = {
    region: config.aws.region,
  };
  // Set endpoint for local client, otherwise provider default
  if (config.aws.endpoint != null) {
    dynamoClientConfig['endpoint'] = config.aws.endpoint;
  }
  const client = new DynamoDBClient(dynamoClientConfig);
  dynamoDb = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
    },
  });
  return dynamoDb;
}
