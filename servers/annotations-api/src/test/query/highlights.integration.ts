import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server/index.ts';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../server/apollo/context.ts';
import { readClient, writeClient } from '../../database/client.ts';
import { GET_HIGHLIGHTS, seedData } from './highlights-fixtures.ts';
import { Application } from 'express';

describe('Highlights on a SavedItem', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  const headers = { userId: '1', premium: 'false' };
  const writeDb = writeClient();
  const readDb = readClient();
  const now = new Date();
  const testData = seedData(now);

  beforeAll(async () => {
    await Promise.all(
      Object.keys(testData).map((table) => writeDb(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) =>
        writeDb(table).insert(data),
      ),
    );
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });
  it('should return singleton Highlights array when a SavedItem has one highlight', async () => {
    const variables = { itemId: 1 };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(GET_HIGHLIGHTS), variables });
    const expectedAnnotation = {
      id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      quote: "'We should rewrite it all,' said Pham.",
      patch: 'patch1',
      version: 1,
      _updatedAt: Math.round(now.getTime() / 1000),
      _createdAt: Math.round(now.getTime() / 1000),
    };
    const annotations = res.body.data?._entities[0].annotations.highlights;
    // Check all fields are resolved
    expect(res).toBeTruthy();
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatchObject(expectedAnnotation);
  });
  it('should return an array of all active (not-deleted) highlights associated with a SavedItem', async () => {
    const variables = { itemId: 2 };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(GET_HIGHLIGHTS), variables });
    const expectedQuotes = [
      'You and a thousand of your friends would have to work for a century or so to reproduce it.',
      "The word for all this is 'mature programming environment.'",
    ];
    const annotations = res.body.data?._entities[0].annotations.highlights;

    expect(res).toBeTruthy();
    expect(annotations).toHaveLength(2);
    expect(annotations.map((_) => _.quote)).toEqual(
      expect.arrayContaining(expectedQuotes),
    );
  });
  it('should return an empty Highlights array if there are no highlights on a SavedItem', async () => {
    const variables = { itemId: 3 };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(GET_HIGHLIGHTS), variables });
    const annotations = res.body.data?._entities[0].annotations?.highlights;

    expect(res).toBeTruthy();
    expect(annotations).toHaveLength(0);
  });
  it('converts null patch to empty string and does not throw error', async () => {
    const variables = { itemId: 2 };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '5', premium: 'true' })
      .send({ query: print(GET_HIGHLIGHTS), variables });
    const annotations = res.body.data?._entities[0].annotations?.highlights;
    const expected = {
      id: '4d27b61e-bc6b-4de7-92f3-5214d6eb2741',
      quote:
        'Basically, when hardware performance has been pushed to its final limit, and programmers have had several centuries to code, you reach a point where there is far more signicant code than can be rationalized',
      patch: '',
      version: 0,
      _updatedAt: Math.round(now.getTime() / 1000),
      _createdAt: Math.round(now.getTime() / 1000),
    };
    expect(res.body.errors).toBeUndefined();
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toEqual(expected);
  });
});
