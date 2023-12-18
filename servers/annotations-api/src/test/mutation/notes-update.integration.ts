import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { dynamoClient, readClient, writeClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import { UPDATE_NOTE } from './notes-mutations';
import { NoteInput } from '../../types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import config from '../../config';
import { noteSeedCommand } from '../query/notes-fixtures';
import { NotesDataService } from '../../dataservices/notes';
import { truncateTable } from '../utils';

describe('Notes update', () => {
  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const baseHeaders = { userId: '1', premium: 'false' };
  const writeDb = writeClient();
  const readDb = readClient();
  const now = new Date();
  const testData = seedData(now);
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const dynamodb = DynamoDBDocumentClient.from(client);

  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
    await Promise.all(
      Object.keys(testData).map((table) => writeDb(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) =>
        writeDb(table).insert(data),
      ),
    );
    await truncateTable(config.dynamoDb.notesTable.name, client);
    await dynamodb.send(noteSeedCommand(now));
  });
  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });
  describe('for premium users', () => {
    const headers = { ...baseHeaders, premium: 'true' };

    it('adds a note to an existing higlight without any notes', async () => {
      const variables: NoteInput = {
        id: '29de0654-a2ab-4df3-afc2-3d0d8d29ecbe',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(UPDATE_NOTE), variables });
      const result = res.body.data?.updateSavedItemHighlightNote;
      const expectedHighlight = {
        text: 'sweeter than a bucket full of strawberries',
      };
      expect(result).toEqual(expect.objectContaining(expectedHighlight));
    });
    it('updates a note on an existing higlight that already has a note', async () => {
      const variables: NoteInput = {
        id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(UPDATE_NOTE), variables });
      const result = res.body.data?.updateSavedItemHighlightNote;
      const expectedHighlight = {
        text: 'sweeter than a bucket full of strawberries',
      };
      expect(result).toEqual(expect.objectContaining(expectedHighlight));
      const dbRecord = await new NotesDataService(dynamoClient(), '1').get(
        'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      );
      expect(dbRecord?.text).toEqual(
        'sweeter than a bucket full of strawberries',
      );
    });
    it('returns NOT_FOUND if the highlight does not exist', async () => {
      const variables: NoteInput = {
        id: '99999',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(UPDATE_NOTE), variables });
      expect(res.body.data?.updateSavedItemHighlightNote).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain('Not Found');
    });
  });

  describe('for non-premium users', () => {
    const headers = baseHeaders;

    it('should throw an invalid permissions error', async () => {
      const variables: NoteInput = {
        id: '29de0654-a2ab-4df3-afc2-3d0d8d29ecbe',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(UPDATE_NOTE), variables });
      expect(res.body.data?.updateSavedItemHighlightNote).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain(
        'Premium account required',
      );
    });
  });
});
