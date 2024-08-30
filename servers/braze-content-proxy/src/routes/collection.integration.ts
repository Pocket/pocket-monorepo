import config from '../config';
import request from 'supertest';
import { Server } from 'http';
import { Application } from 'express';
import { brazeCollectionsFixture, graphCollectionFixture } from './fixture';
import { client } from '../graphql/client-api-proxy';
import { startServer } from '../server';

describe(`get collection test`, () => {
  let app: Application;
  let server: Server;

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`/get collection should return braze collection payload`, async () => {
    const testSlug = 'the-world-as-explained-by-pop-culture';
    // spying on the getStories function to make it return a mock response
    jest
      .spyOn(client, 'query')
      .mockResolvedValue(graphCollectionFixture as any);
    const response = await request(app).get(
      `/collection/${testSlug}?apikey=${config.aws.brazeApiKey}`,
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(brazeCollectionsFixture);
    expect(response.headers['cache-control']).not.toBeUndefined();
    expect(response.headers['cache-control']).toBe('public, max-age=120');
  });

  it('should return 500 if collection is not found', async () => {
    const notFoundGraphError = {
      errors: [
        {
          message: 'Error - Not Found: not-found',
          path: ['getCollectionBySlug'],
          extensions: {
            code: 'NOT_FOUND',
            serviceName: 'collection',
          },
        },
      ],
      data: {
        getCollectionBySlug: null,
      },
    };
    jest.spyOn(client, 'query').mockResolvedValue(notFoundGraphError as any);
    const response = await request(app).get(
      `/collection/not-found-slug?apikey=${config.aws.brazeApiKey}`,
    );
    expect(response.statusCode).toBe(500);
  });

  it('should return 500 if invalid api key is provided ', async () => {
    const response = await request(app).get(
      `/collection/this-is-test-slug?apikey=invalid-api-key`,
    );
    expect(response.statusCode).toBe(500);
    expect(response.body.error).not.toBeUndefined();
    expect(response.body.error).toBe(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  });
});
