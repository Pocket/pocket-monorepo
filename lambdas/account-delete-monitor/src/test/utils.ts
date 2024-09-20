import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommandInput,
  paginateScan,
  BatchWriteCommandInput,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

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
  if (tableInfo?.Table?.KeySchema == null) return;
  const keyAttributes = tableInfo.Table.KeySchema.map(
    (key) => key.AttributeName,
  );
  for await (const res of paginator) {
    if (res.Count === 0 || res.Items == null) return;

    const deleteRequests = res.Items.map((item) => {
      const itemKeys = keyAttributes.reduce(
        (keyMap, key: string) => {
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
