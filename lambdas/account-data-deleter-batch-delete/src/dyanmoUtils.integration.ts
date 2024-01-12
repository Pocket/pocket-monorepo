import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { config } from './config';
import { BatchDeleteDyanmoClient } from './dynamoUtils';
import { seedData, truncateTable } from './test/utils';

describe('Data fetcher', () => {
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });

  const fetcher = new BatchDeleteDyanmoClient(client);

  beforeAll(async () => {
    await seedData(client);
  });
  afterAll(async () => {
    await truncateTable(config.dynamo.processedUsers.tableName, client);
    await truncateTable(config.dynamo.pendingUsers.tableName, client);
  });
  describe('read-only operations', () => {
    it('fetches a chunk of data', async () => {
      const res = await fetcher.getBatch(20);
      expect(res.length).toEqual(20);
    });
    it('fetches a chunk smaller than page size, if data ends', async () => {
      const res = await fetcher.getBatch(1000);
      expect(res.length).toBeLessThan(1000);
      expect(res.length).toBeGreaterThan(0);
    });
  });
  describe('write operations', () => {
    const dynamoDoc = DynamoDBDocumentClient.from(client);

    afterEach(async () => await seedData(client));
    it.each([
      { n: 10, d: '<=12' },
      { n: 15, d: '>12' },
    ])(
      'deletes IDs from one table and moves to another ($d)',
      async ({ n }) => {
        const pendingTable = config.dynamo.pendingUsers.tableName;
        const processedTable = config.dynamo.processedUsers.tableName;
        const ids = await fetcher.getBatch(n);
        await fetcher.moveBatch(ids);
        const fetchRequests = {
          RequestItems: {
            [pendingTable]: {
              Keys: [] as Record<string, number>[],
            },
            [processedTable]: {
              Keys: [] as Record<string, number>[],
            },
          },
        };
        ids.forEach((id) => {
          fetchRequests.RequestItems[pendingTable].Keys.push({
            [config.dynamo.pendingUsers.keyColumn]: id,
          });
          fetchRequests.RequestItems[processedTable].Keys.push({
            [config.dynamo.processedUsers.keyColumn]: id,
          });
        });
        const res = await dynamoDoc.send(new BatchGetCommand(fetchRequests));
        expect(res.Responses).not.toBeUndefined();
        expect(res.Responses?.[pendingTable].length).toEqual(0);
        expect(res.Responses?.[processedTable].length).toEqual(n);
      },
    );
  });
});
