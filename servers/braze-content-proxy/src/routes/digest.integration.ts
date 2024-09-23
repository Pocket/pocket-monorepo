import config from '../config';
import request from 'supertest';
import { Server } from 'http';
import { Application } from 'express';
import { startServer } from '../server';
import nock, { cleanAll, restore } from 'nock';
import { UserDigestQuery } from '../generated/graphql/types';
import { ApolloQueryResult } from '@apollo/client/core';

describe(`get digest`, () => {
  let app: Application;
  let server: Server;

  const testEncodedUserId =
    'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5';
  const validUrl = `/digest/${testEncodedUserId}?apikey=${config.aws.brazeApiKey}`;

  const fakeResponse: Omit<
    ApolloQueryResult<UserDigestQuery>,
    'loading' | 'networkStatus'
  > = {
    data: {
      user: {
        savedItems: {
          edges: [
            {
              node: {
                item: {
                  __typename: 'Item',
                  preview: {
                    title: 'Cool Item 1',
                    url: 'https://www.item1.com',
                    image: {
                      cachedImages: [
                        {
                          id: 'thumbnail',
                          url: 'https://image1.com',
                        },
                      ],
                    },
                  },
                },
              },
            },
            {
              node: {
                item: {
                  __typename: 'Item',
                  preview: {
                    title: '',
                    url: 'https://item2.com',
                    image: null,
                  },
                },
              },
            },
            {
              node: {
                item: {
                  __typename: 'Item',
                  preview: {
                    title: 'Super Secret',
                    url: 'https://item3.com',
                    image: {
                      cachedImages: [
                        {
                          id: 'thumbnail',
                          url: 'image2.com',
                        },
                      ],
                    },
                  },
                },
              },
            },
            {
              node: {
                item: {
                  __typename: 'PendingItem',
                },
              },
            },
          ],
        },
      },
    },
  };

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
    cleanAll();
    restore();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 500 if invalid api key is provided ', async () => {
    const response = await request(app).get(
      `/digest/someuseridhere?apikey=invalid-api-key`,
    );
    expect(response.statusCode).toBe(500);
    expect(response.body.error).not.toBeUndefined();
    expect(response.body.error).toBe(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  });

  it('should return correct data when valid query params are provided', async () => {
    nock(config.clientApi.uri).post('/').reply(200, fakeResponse);

    const response = await request(app).get(validUrl);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        imageUrl: 'https://image1.com',
        title: 'Cool Item 1',
        url: 'https://www.item1.com',
      },
      {
        imageUrl: null,
        title: '',
        url: 'https://item2.com',
      },
      {
        imageUrl: 'image2.com',
        title: 'Super Secret',
        url: 'https://item3.com',
      },
    ]);
  });
});
