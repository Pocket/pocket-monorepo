import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './config.ts';

/** Initialize outside of handler to follow best practices
 * Note that TCP connection reuse is enabled by default in v3
 */
const dynamoClientConfig: DynamoDBClientConfig = {
  region: config.aws.region,
};
// Set endpoint for local client, otherwise provider default
if (config.aws.endpoint != null) {
  dynamoClientConfig['endpoint'] = config.aws.endpoint;
}
export const dynamo = new DynamoDBClient(dynamoClientConfig);

/**
 * Use the document client for simpler interface in node
 */
export const client = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
});
