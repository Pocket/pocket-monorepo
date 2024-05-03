import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext } from '../apollo/context.js';
import { startServer } from '../apollo/server.js';
import { Application } from 'express';
import { CREATE_SHARE, ADD_SHARE_CONTEXT } from './operations.js';
import { dynamoClient } from '../datasources/dynamoClient.js';
import { SharesDataSourceAuthenticated } from '../datasources/shares.js';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const uuidOverride = '0000-00-00';
const uuidMock = jest.fn().mockImplementation(() => uuidOverride);
jest.mock('uuid', () => ({ v4: () => uuidMock() }));

describe('addShareContext mutation', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const headers = { applicationisnative: 'true', userId: '1', guid: 'abc' };
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
  it.each([
    {
      context: {
        note: 'an innocent video',
      },
      expected: {
        note: 'an innocent video',
      },
    },
    {
      context: {
        highlights: { quotes: ['never gonna let you down'] },
      },
      expected: {
        highlights: [{ quote: 'never gonna let you down' }],
      },
    },
    {
      context: {
        note: 'an innocent video',
        highlights: { quotes: ['never gonna let you down'] },
      },
      expected: {
        note: 'an innocent video',
        highlights: [{ quote: 'never gonna let you down' }],
      },
    },
  ])('replaces existing context field(s)', async (fixture) => {
    const originalContext = {
      note: 'this is a cool video!',
      highlights: [{ quote: 'never gonna give' }],
    };
    const createVars = {
      target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      context: {
        note: 'this is a cool video!',
        highlights: { quotes: ['never gonna give'] },
      },
    };
    await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: CREATE_SHARE, variables: createVars });
    const variables = {
      slug: uuidOverride,
      context: fixture.context,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: ADD_SHARE_CONTEXT, variables });
    const expected = {
      addShareContext: {
        slug: uuidOverride,
        context: {
          ...originalContext,
          ...fixture.expected,
        },
      },
    };
    expect(res.body.data).toEqual(expected);
  });
  it('returns ShareNotFound if owner (guid) does not match', async () => {
    const createVars = {
      target: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      context: {
        note: 'this is a cool video!',
        highlights: { quotes: ['never gonna give'] },
      },
    };
    await request(app)
      .post(graphQLUrl)
      .set({ applicationisnative: 'true', userId: '1', guid: 'def' })
      .send({ query: CREATE_SHARE, variables: createVars });
    const variables = {
      slug: uuidOverride,
      context: { note: 'please watch' },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: ADD_SHARE_CONTEXT, variables });
    const expected = {
      addShareContext: {
        message: 'The link has expired or does not exist.',
      },
    };
    expect(res.body.data).toEqual(expected);
  });
  it('returns ShareNotFound if the share does not have an explicit owner', async () => {
    await new SharesDataSourceAuthenticated(dynamoClient()).createShare({
      shareId: uuidOverride,
      targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      note: 'this is a cool video!',
      highlights: ['never gonna give'],
      createdAt: now / 1000,
    });
    const variables = {
      slug: uuidOverride,
      context: { note: 'please watch' },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: ADD_SHARE_CONTEXT, variables });
    const expected = {
      addShareContext: {
        message: 'The link has expired or does not exist.',
      },
    };
    expect(res.body.data).toEqual(expected);
  });
  it('returns ShareNotFound if the share does not exist', async () => {
    const variables = {
      slug: 'aaaaaa-aa-aaaaaaah',
      context: { note: 'please watch' },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: ADD_SHARE_CONTEXT, variables });
    const expected = {
      addShareContext: {
        message: 'The link has expired or does not exist.',
      },
    };
    expect(res.body.data).toEqual(expected);
  });
  it('Returns generic error if error is not ConditionalCheckFailedException', async () => {
    jest
      .spyOn(DynamoDBDocumentClient.prototype, 'send')
      .mockImplementation(() => Promise.reject(new Error('some error')));
    const variables = {
      slug: 'aaaaaa-aa-aaaaaaah',
      context: { note: 'please watch' },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: ADD_SHARE_CONTEXT, variables });
    expect(res.body.errors[0].message).toEqual('Failed to update share record');
    expect(res.body.errors[0].extensions.code).toEqual('INTERNAL_SERVER_ERROR');
  });
});
