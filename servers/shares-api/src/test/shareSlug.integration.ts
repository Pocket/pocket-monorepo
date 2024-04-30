import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext } from '../apollo/context';
import { startServer } from '../apollo/server';
import { Application } from 'express';
import { GET_SHARE } from './operations';
import { dynamoClient } from '../datasources/dynamoClient';
import { SharesDataSourceAuthenticated } from '../datasources/shares';

describe('shareSlug', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const headers = { applicationisnative: 'true', userId: '1' };
  const now = Math.round(Date.now() / 1000) * 1000;
  const expected = {
    shareSlug: {
      slug: '0000-00-00-000',
      createdAt: new Date(now).toISOString(),
      shareUrl: `https://pocket.co/share/0000-00-00-000`,
      targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      context: {
        note: 'this is a cool video!',
        highlights: [{ quote: 'never gonna give' }],
      },
    },
  };

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
    await new SharesDataSourceAuthenticated(dynamoClient()).createShare({
      shareId: '0000-00-00-000',
      targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      note: 'this is a cool video!',
      highlights: ['never gonna give'],
      createdAt: now / 1000,
    });
  });

  afterAll(async () => {
    await server.stop();
  });
  afterEach(async () => {});
  it.each(['anonymous', undefined])(
    'can be requested by unauthenticated users',
    async (userid) => {
      const variables = { slug: '0000-00-00-000' };
      const anonHeaders = { ...(userid && { userid }) };
      const res = await request(app)
        .post(graphQLUrl)
        .set(anonHeaders)
        .send({ query: GET_SHARE, variables });
      expect(res.body.data).toEqual(expected);
    },
  );
  it('can be requested by authenticated users', async () => {
    const variables = { slug: '0000-00-00-000' };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: GET_SHARE, variables });
    expect(res.body.data).toEqual(expected);
  });
  it('returns not found if does not exist ', async () => {
    const variables = { slug: '123-45-78-000' };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: GET_SHARE, variables });
    const expected = {
      shareSlug: {
        message: 'The link has expired or does not exist.',
      },
    };
    expect(res.body.data).toEqual(expected);
  });
});
