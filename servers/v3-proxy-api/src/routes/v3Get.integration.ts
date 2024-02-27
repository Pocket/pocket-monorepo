import request from 'supertest';
import { app, server } from '../main';
import * as Sentry from '@sentry/node';
import * as GraphQLCalls from '../graph/graphQLClient';
import { serverLogger } from '@pocket-tools/ts-logger';
import { setTimeout } from 'timers/promises';
import { mockGraphGetComplete } from '../test/fixtures';

describe('v3Get', () => {
  const expectedHeaders = {
    'X-Error-Code': '198',
    'X-Error': 'Internal Server Error',
  };
  afterAll(async () => {
    server.close();
    // Make sure it closes
    await setTimeout(100);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('type: simple', () => {
    it('GET should log to Sentry and throw 5xx for unknown errors', async () => {
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => {
          throw new Error('test error');
        });
      const response = await request(app)
        .get('/v3/get')
        .query({ consumer_key: 'test', access_token: 'test' });
      expect(response.status).toBe(500);
      expect(sentrySpy).toHaveBeenCalledTimes(1);
      expect(response.headers['x-error-code']).toBe(
        expectedHeaders['X-Error-Code'],
      );
      expect(response.body).toEqual({
        error: 'GET: v3/get: Error: test error',
      });
    });

    it('POST should log to Sentry and throw 5xx for unknown errors', async () => {
      const consoleSpy = jest.spyOn(serverLogger, 'error');
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => {
          throw new Error('test error');
        });
      const response = await request(app)
        .post('/v3/get')
        .send({ consumer_key: 'test', access_token: 'test' });
      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(sentrySpy).toHaveBeenCalledTimes(1);
      expect(response.headers['x-error-code']).toBe(
        expectedHeaders['X-Error-Code'],
      );
      expect(response.body).toEqual({
        error: 'POST: v3/get: Error: test error',
      });
    });
  });
  describe('type: complete', () => {
    it('GET should log to Sentry and throw 5xx for unknown errors', async () => {
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => {
          throw new Error('test error');
        });
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        detailType: 'complete',
      });
      expect(response.status).toBe(500);
      expect(sentrySpy).toHaveBeenCalledTimes(1);
      expect(response.headers['x-error-code']).toBe(
        expectedHeaders['X-Error-Code'],
      );
      expect(response.body).toEqual({
        error: 'GET: v3/get: Error: test error',
      });
    });

    it('POST should log to Sentry and throw 5xx for unknown errors', async () => {
      const consoleSpy = jest.spyOn(serverLogger, 'error');
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => {
          throw new Error('test error');
        });
      const response = await request(app).post('/v3/get').send({
        consumer_key: 'test',
        access_token: 'test',
        detailType: 'complete',
      });
      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(sentrySpy).toHaveBeenCalledTimes(1);
      expect(response.headers['x-error-code']).toBe(
        expectedHeaders['X-Error-Code'],
      );
      expect(response.body).toEqual({
        error: 'POST: v3/get: Error: test error',
      });
    });
  });
  describe('schema validation', () => {
    it.each([
      { consumer_key: 'test', access_token: 'test', detailType: 'complete' },
      {
        detailType: 'complete',
        contentType: 'article',
        count: '10',
        offset: '10',
        state: 'read',
        favorite: '0',
        tag: 'tag',
        sort: 'newest',
        since: '12345',
      },
    ])('should work with valid query parameters (GET)', async (params) => {
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).get('/v3/get').query(params);
      expect(response.status).toBe(200);
    });
    it.each([
      { consumer_key: 'test', access_token: 'test', detailType: 'complete' },
      {
        detailType: 'complete',
        contentType: 'article',
        count: '10',
        offset: '10',
        state: 'read',
        favorite: '0',
        tag: 'tag',
        sort: 'newest',
        since: '12345',
      },
    ])('should work with valid body parameters (POST)', async (params) => {
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).post('/v3/get').send(params);
      expect(response.status).toBe(200);
    });
    it.each([
      {
        query: {
          consumer_key: '',
          detailType: 'simple',
        },
        errorCount: 1,
      },
      {
        query: {
          detailType: 'complete',
          count: '10',
          offset: '10',
          state: 'not-realstate',
          favorite: '0',
          tag: 'tag',
        },
        errorCount: 1,
      },
      {
        query: {
          detailType: 'ultra-hd',
          count: '100000',
          offset: '-10',
          state: 'not-realstate',
          since: '2022-02-23',
          tag: '',
          favorite: 'true',
          contentType: 'unsupported-pod',
          sort: 'gravity',
        },
        errorCount: 9,
      },
    ])(
      'should work with invalid query parameters',
      async ({ query, errorCount }) => {
        jest
          .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
          .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
        const response = await request(app).get('/v3/get').query(query);
        expect(response.status).toBe(400);
        expect(response.body.errors.length).toEqual(errorCount);
      },
    );
  });
});
