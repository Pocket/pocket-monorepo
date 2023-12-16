import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { readClient } from '../../database/client';
import { GET_HIGHLIGHTS, seedData } from './highlights-fixtures';

describe('Highlights on a SavedItem', () => {
  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  const headers = { userId: '1', premium: 'false' };
  const db = readClient();
  const now = new Date();
  const testData = seedData(now);

  beforeAll(async () => {
    await Promise.all(
      Object.keys(testData).map((table) => db(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) => db(table).insert(data)),
    );
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  afterAll(async () => {
    await server.stop();
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
});
