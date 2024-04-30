import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext } from '../apollo/context';
import { startServer } from '../apollo/server';
import { Application } from 'express';
import { CREATE_SHARE, GET_SHARE } from './operations';

const uuidMock = jest.fn().mockImplementation(() => '0000-00-00');

jest.mock('uuid', () => ({ v4: () => uuidMock() }));

describe('CreateShareLink', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const nativeHeader = { applicationisnative: 'true' };
  const headers = { ...nativeHeader, userId: '1' };
  const now = Math.round(Date.now() / 1000) * 1000;
  jest.useFakeTimers({ now });

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });
  afterEach(async () => {});
  it.each(['anonymous', undefined, '1'])(
    'returns forbidden error if non-native app attempts to return share link (regardless of auth)',
    async (userId) => {
      const nonNativeHeader = userId
        ? { applicationisnative: 'false', userid: userId }
        : { applicationisnative: 'false' };
      const variables = {
        target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(nonNativeHeader)
        .send({ query: CREATE_SHARE, variables });
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors[0].extensions.code).toEqual('FORBIDDEN');
    },
  );
  it.each(['anonymous', undefined])(
    'does not create a share link and returns unauthenticated error for unauthenticated users',
    async (userId) => {
      const unauthHeaders = userId
        ? { ...nativeHeader, userid: userId }
        : nativeHeader;
      const variables = {
        target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(unauthHeaders)
        .send({ query: CREATE_SHARE, variables });
      expect(res.body.errors?.length).toEqual(1);
      expect(res.body.errors[0].extensions.code).toEqual('UNAUTHENTICATED');
    },
  );
  it('an authenticated user can create a share link', async () => {
    const uuidMock = '0000-00-00';
    const variables = {
      target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      context: {
        note: 'this is a cool video!',
        highlights: { quotes: ['never gonna give'] },
      },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: CREATE_SHARE, variables });
    expect(res.body.data).toEqual({
      createShareLink: { shareUrl: `https://pocket.co/share/${uuidMock}` },
    });
    const roundtrip = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({
        query: GET_SHARE,
        variables: { slug: uuidMock },
      });
    const expected = {
      shareSlug: {
        slug: uuidMock,
        createdAt: new Date(now).toISOString(),
        shareUrl: `https://pocket.co/share/${uuidMock}`,
        targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        context: {
          note: 'this is a cool video!',
          highlights: [{ quote: 'never gonna give' }],
        },
      },
    };
    expect(roundtrip.body.data).toEqual(expected);
  });
});
