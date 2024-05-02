import config from '../config/index.js';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
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

/**
 * A helper command to complelety clear out dynamodb that should be used mainly in tests
 * @param client Client to use for dynamodb
 */
export async function clearDynamoDB(
  client: DynamoDBDocumentClient,
): Promise<void> {
  // Set this to true to get through one iteration of the while loop
  let lastEvaluatedKey: any = true;
  const queryCommandInput: ScanCommandInput = {
    TableName: config.dynamoDb.itemSummaryTable.name,
    Limit: 25, // Max value for batch write; non-expandable dynamodb limit
    ProjectionExpression: 'urlHash',
  };
  // If LastEvaluatedKey is present in the result set, there are
  // more values to query for
  while (lastEvaluatedKey != null) {
    const result: ScanCommandOutput = await client.send(
      new ScanCommand(queryCommandInput),
    );
    if (result.Items?.length > 0) {
      const deleteRequests = result.Items.map((res) => ({
        DeleteRequest: {
          Key: {
            ['urlHash']: res['urlHash']['S'],
          },
        },
      }));
      await client.send(
        new BatchWriteCommand({
          RequestItems: {
            [config.dynamoDb.itemSummaryTable.name]: deleteRequests,
          },
        }),
      );
    }
    // Add the start key to the query command in case there are more
    // results to fetch; if null, loop will exit
    lastEvaluatedKey = result.LastEvaluatedKey;
    queryCommandInput['ExclusiveStartKey'] = lastEvaluatedKey;
  }
}
