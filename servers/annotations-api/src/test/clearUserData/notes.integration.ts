import { nanoid } from 'nanoid';
import config from '../../config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  QueryCommandInput,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { batchWriteMockNotes } from '../query/notes-fixtures';
import { NotesDataService } from '../../dataservices/notes';

describe('clearUserData for Notes data', () => {
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const queryCommand = (userId: string, limit = 200): QueryCommandInput => ({
    TableName: config.dynamoDb.notesTable.name,
    IndexName: 'userId',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId,
    },
    Limit: limit,
    ProjectionExpression: config.dynamoDb.notesTable.key,
  });

  async function seedTable(count: number, userId: string) {
    const seeder = batchWriteMockNotes(count, userId);
    let batchCommand = seeder.next();
    while (!batchCommand.done) {
      await dynamodb.send(new BatchWriteCommand(batchCommand.value));
      batchCommand = seeder.next();
    }
  }

  const dynamodb = DynamoDBDocumentClient.from(client);
  // Annoying to clear dynamo data, so we'll rely on guid non-collision to isolate test data
  const smallUser = nanoid();
  const bigUser = nanoid();
  const noUser = nanoid();
  beforeAll(async () => {
    await seedTable(4, smallUser);
    await seedTable(120, bigUser);
  });
  it('deletes < 25 records (dynamo batch limit) for a user id', async () => {
    const notesService = new NotesDataService(client, smallUser);
    await notesService.clearUserData();
    const res = await dynamodb.send(new QueryCommand(queryCommand(smallUser)));
    expect(res['$metadata'].httpStatusCode).toEqual(200);
    expect(res.Count).toEqual(0);
    expect(res.Items?.length).toEqual(0);
    expect(res.LastEvaluatedKey).toBeUndefined();
  });
  it('deletes multiple batches of records for a user id', async () => {
    const notesService = new NotesDataService(client, bigUser);
    await notesService.clearUserData();
    const res = await dynamodb.send(new QueryCommand(queryCommand(bigUser)));
    expect(res['$metadata'].httpStatusCode).toEqual(200);
    expect(res.Count).toEqual(0);
    expect(res.Items?.length).toEqual(0);
    expect(res.LastEvaluatedKey).toBeUndefined();
  });
  it('does not throw an error if there are no records to delete', async () => {
    const notesService = new NotesDataService(client, noUser);
    await notesService.clearUserData();
    const res = await dynamodb.send(new QueryCommand(queryCommand(noUser)));
    expect(res['$metadata'].httpStatusCode).toEqual(200);
    expect(res.Count).toEqual(0);
    expect(res.Items?.length).toEqual(0);
    expect(res.LastEvaluatedKey).toBeUndefined();
  });
});
