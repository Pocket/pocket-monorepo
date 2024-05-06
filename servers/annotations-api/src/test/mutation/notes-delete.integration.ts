import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../server/apollo/context';
import { readClient, writeClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import { DELETE_NOTE } from './notes-mutations';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import config from '../../config';
import { noteSeedCommand } from '../query/notes-fixtures';
import { NotesDataService } from '../../dataservices/notes';
import { Application } from 'express';

describe('Notes delete', () => {
  let app: Application;
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
    await dynamodb.send(noteSeedCommand(now));
  });
  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });
  describe('for premium users', () => {
    const headers = { ...baseHeaders, premium: 'true' };

    it('returns NOT_FOUND error if attempting to delete a note from a highlight that has no notes', async () => {
      const variables = { id: '2' };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(DELETE_NOTE), variables });
      expect(res.body.data).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain('Not Found');
    });
    it('deletes a note on a highlight that has a note', async () => {
      const variables = { id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b' };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(DELETE_NOTE), variables });
      const result = res.body.data?.deleteSavedItemHighlightNote;
      expect(result).toEqual('b3a95dd3-dd9b-49b0-bb72-dc6daabd809b');
      const dbRecord = await new NotesDataService(client, '1').get(
        'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      );
      expect(dbRecord).toBeNull();
    });
    it('returns NOT_FOUND if the highlight does not exist', async () => {
      const variables = { id: '99999' };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(DELETE_NOTE), variables });
      expect(res.body.data).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain('Not Found');
    });
  });

  describe('for non-premium users', () => {
    const headers = baseHeaders;

    it('should throw an invalid permissions error', async () => {
      const variables = {
        id: '29de0654-a2ab-4df3-afc2-3d0d8d29ecbe',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(DELETE_NOTE), variables });
      expect(res.body.data).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain(
        'Premium account required',
      );
    });
  });
});
