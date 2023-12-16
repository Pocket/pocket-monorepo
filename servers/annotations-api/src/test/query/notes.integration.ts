import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { readClient } from '../../database/client';
import { seedData } from './highlights-fixtures';
import { noteSeedCommand, GET_NOTES } from './notes-fixtures';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import config from '../../config';
import { truncateTable } from '../utils';

describe('Notes on a Highlight', () => {
  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  const headers = { userId: '1', premium: 'true' };
  const db = readClient();
  const now = new Date();
  const testData = seedData(now);
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const dynamodb = DynamoDBDocumentClient.from(client);

  beforeAll(async () => {
    await Promise.all(
      Object.keys(testData).map((table) => db(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) => db(table).insert(data)),
    );
    await truncateTable(config.dynamoDb.notesTable.name, client);
    await dynamodb.send(noteSeedCommand(now));
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  afterAll(async () => {
    await server.stop();
    client.destroy();
  });
  it('should return a highlight with note when available', async () => {
    const variables = { itemId: 1 };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(GET_NOTES), variables });
    const expectedHighlightWithNote = {
      id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      note: {
        _createdAt: Math.round(now.getTime() / 1000),
        _updatedAt: Math.round(now.getTime() / 1000),
        text: `there you have it, that's great`,
      },
    };

    const highlights = res.body.data?._entities[0].annotations.highlights;
    // Check all fields are resolved
    expect(res).toBeTruthy();
    expect(res.body.errors).toBeUndefined();
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toMatchObject(expectedHighlightWithNote);
  });
  it('should return null notes field if highlight has no notes', async () => {
    const variables = { itemId: 2 };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(GET_NOTES), variables });
    const highlights = res.body.data?._entities[0].annotations?.highlights;
    expect(res).toBeTruthy();
    expect(highlights.length).toBeGreaterThanOrEqual(1); // don't care how much, just that there is one or more
    expect(highlights[0].note).toBeNull();
  });
});
