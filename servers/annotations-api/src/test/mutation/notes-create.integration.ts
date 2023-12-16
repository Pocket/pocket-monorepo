import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { readClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import { CREATE_NOTE } from './notes-mutations';
import { NoteInput } from '../../types';

describe('Notes creation', () => {
  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const baseHeaders = { userId: '1', premium: 'false' };
  const db = readClient();
  const now = new Date();
  const testData = seedData(now);
  const truncateAndSeed = async () => {
    await Promise.all(
      Object.keys(testData).map((table) => db(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) => db(table).insert(data)),
    );
  };
  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    await truncateAndSeed();
  });
  describe('for premium users', () => {
    const headers = { ...baseHeaders, premium: 'true' };

    it('adds a note to an existing higlight', async () => {
      const variables: NoteInput = {
        id: '29de0654-a2ab-4df3-afc2-3d0d8d29ecbe',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_NOTE), variables });
      const result = res.body.data?.createSavedItemHighlightNote;
      const expectedHighlight = {
        text: 'sweeter than a bucket full of strawberries',
      };
      expect(result).toEqual(expect.objectContaining(expectedHighlight));
    });
    it('returns NOT_FOUND if the highlight does not exist', async () => {
      const variables: NoteInput = {
        id: '99999',
        input: 'sweeter than a bucket full of strawberries',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_NOTE), variables });
      expect(res.body.data?.createSavedItemHighlightNote).toBeNull();
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
        .send({ query: print(CREATE_NOTE), variables });
      expect(res.body.data?.createSavedItemHighlightNote).toBeNull();
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors?.[0].message).toContain(
        'Premium account required',
      );
    });
  });
});
