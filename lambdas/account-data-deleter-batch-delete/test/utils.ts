import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommandInput,
  BatchWriteCommand,
  paginateScan,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { chunk } from 'lodash';
import { config } from '../config';

/**
 * Seed data of consecutive stringified integers, hash key only
 * @param client Instantiated DynamoDB Client
 */
export async function seedData(client: DynamoDBClient): Promise<void> {
  const dynamolib = DynamoDBDocumentClient.from(client);

  // Put the user data in
  const putRequests = [...Array(30).keys()].map((_id) => {
    return {
      PutRequest: {
        Item: {
          [config.dynamo.pendingUsers.keyColumn]: _id,
        },
      },
    };
  });
  const chunked = chunk(putRequests, 25);
  const requests = chunked.map((req) => ({
    RequestItems: { [config.dynamo.pendingUsers.tableName]: req },
  }));
  for await (const req of requests) {
    await dynamolib.send(new BatchWriteCommand(req));
  }
}

/**
 * Delete all records in a DynamoDB Table. Used for test cleanup.
 * @param table
 * @param client
 * @returns
 */
export async function truncateTable(table: string, client: DynamoDBClient) {
  const dynamolib = DynamoDBDocumentClient.from(client);
  const scanInput: ScanCommandInput = {
    TableName: table,
  };
  const paginator = paginateScan(
    { client: dynamolib, pageSize: 20 },
    scanInput,
  );
  const tableInfo = await client.send(
    new DescribeTableCommand({ TableName: table }),
  );
  const keyAttributes = tableInfo.Table.KeySchema.map(
    (key) => key.AttributeName,
  );
  for await (const res of paginator) {
    if (res.Count === 0) return;

    const deleteRequests = res.Items.map((item) => {
      const itemKeys = keyAttributes.reduce(
        (keyMap, key) => {
          keyMap[key] = item[key];
          return keyMap;
        },
        {} as { [key: string]: any },
      );
      return {
        DeleteRequest: {
          Key: itemKeys,
        },
      };
    });

    const input: BatchWriteCommandInput = {
      RequestItems: {
        [table]: deleteRequests,
      },
    };
    await dynamolib.send(new BatchWriteCommand(input));
  }
}
