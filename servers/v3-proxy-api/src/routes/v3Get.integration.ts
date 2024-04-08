import request from 'supertest';
import * as Sentry from '@sentry/node';
import * as GraphQLCalls from '../graph/graphQLClient';
import { serverLogger } from '@pocket-tools/ts-logger';
import {
  mockGraphGetComplete,
  mockGraphGetSimple,
  freeTierSearchGraphComplete,
  freeTierSearchGraphSimple,
  freeTierSearchGraphSimpleAnnotations,
  expectedFreeTierResponseSimpleAnnotations,
  expectedFreeTierResponseCompleteAnnotations,
  freeTierSearchGraphCompleteAnnotations,
  mockGraphGetSimpleAnnotations,
  expectedGetSimpleAnnotations,
  mockGraphGetCompleteAnnotations,
  expectedGetCompleteAnnotations,
} from '../test/fixtures';
import { ClientError, GraphQLClient } from 'graphql-request';
import { GraphQLError } from 'graphql-request/build/esm/types';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';

describe('v3Get', () => {
  let app: Application;
  let server: Server;
  const expectedHeaders = {
    'X-Error-Code': '198',
    'X-Error': 'Internal Server Error',
    'X-Source': 'Pocket',
  };
  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
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
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(response.body).toEqual({
        error: 'test error',
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
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(response.body).toEqual({
        error: 'test error',
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
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(response.body).toEqual({
        error: 'test error',
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
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(response.body).toEqual({
        error: 'test error',
      });
    });
  });
  describe('search', () => {
    it('calls search api if search term is included (simple)', async () => {
      const searchApi = jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetSimple')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: 'abc',
        sort: 'relevance',
        detailType: 'simple',
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(searchApi).toHaveBeenCalledTimes(1);
    });

    it('calls search api if search term is included (complete)', async () => {
      const searchApi = jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetComplete')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphComplete));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: 'abc',
        sort: 'relevance',
        detailType: 'complete',
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(searchApi).toHaveBeenCalledTimes(1);
    });
    it('ignores empty search term and does not call search (simple)', async () => {
      const nonSearchApi = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.resolve(mockGraphGetSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: '',
        detailType: 'simple',
      });
      expect(response.status).toEqual(200);
      expect(nonSearchApi).toHaveBeenCalledTimes(1);
    });
    it('ignores empty search term and does not call search (complete)', async () => {
      const nonSearchApi = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: '',
        detailType: 'complete',
      });
      expect(response.status).toEqual(200);
      expect(nonSearchApi).toHaveBeenCalledTimes(1);
    });
  });
  describe('with annotations option', () => {
    let clientSpy;
    afterEach(() => clientSpy.mockRestore());
    it.each([
      {
        requestData: {
          detailType: 'simple',
          search: 'abc',
          sort: 'relevance',
        },
        fixture: {
          requestName: 'callSearchByOffsetSimple' as const,
          requestData: freeTierSearchGraphSimpleAnnotations,
        },
        expected: {
          name: 'searchSavedItemsSimple',
          response: expectedFreeTierResponseSimpleAnnotations,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          search: 'abc',
          sort: 'relevance',
        },
        fixture: {
          requestName: 'callSearchByOffsetComplete' as const,
          requestData: freeTierSearchGraphCompleteAnnotations,
        },
        expected: {
          name: 'searchSavedItemsComplete',
          response: expectedFreeTierResponseCompleteAnnotations,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          search: 'abc',
          sort: 'relevance',
          total: '1',
        },
        fixture: {
          requestName: 'callSearchByOffsetComplete' as const,
          requestData: freeTierSearchGraphCompleteAnnotations,
        },
        expected: {
          name: 'searchSavedItemsComplete',
          response: {
            ...expectedFreeTierResponseCompleteAnnotations,
            total: '2',
          },
        },
      },
      {
        requestData: {
          detailType: 'simple',
          search: 'abc',
          sort: 'relevance',
          total: '1',
        },
        fixture: {
          requestName: 'callSearchByOffsetSimple' as const,
          requestData: freeTierSearchGraphSimpleAnnotations,
        },
        expected: {
          name: 'searchSavedItemsSimple',
          response: {
            ...expectedFreeTierResponseSimpleAnnotations,
            total: '2',
          },
        },
      },
      {
        requestData: {
          detailType: 'simple',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleAnnotations,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimpleAnnotations,
        },
      },
      {
        requestData: {
          detailType: 'complete',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteAnnotations,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompleteAnnotations,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          total: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteAnnotations,
        },
        expected: {
          name: 'savedItemsComplete',
          response: { ...expectedGetCompleteAnnotations, total: '10' },
        },
      },
      {
        requestData: {
          detailType: 'simple',
          total: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleAnnotations,
        },
        expected: {
          name: 'savedItemsSimple',
          response: { ...expectedGetSimpleAnnotations, total: '10' },
        },
      },
    ])(
      'makes request with annotations',
      async ({ requestData, fixture, expected }) => {
        const requestSpy = jest.spyOn(GraphQLCalls, fixture.requestName);
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: 'test',
            access_token: 'test',
            annotations: '1',
          });
        expect(response.body).toEqual(expected.response);
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][3]).toMatchObject({
          withAnnotations: true,
        });
        expect(clientSpy.mock.calls[0][0]['definitions'][0].name.value).toEqual(
          expected.name,
        );
      },
    );
  });
  describe('Graphql error handler', () => {
    it('Returns 400 status code, with logging and sentry, for bad input errors', async () => {
      const consoleSpy = jest.spyOn(serverLogger, 'error');
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      const err = new ClientError(
        {
          errors: [
            {
              message: "invalid type for variable: 'pagination'",
              extensions: {
                name: 'pagination',
                code: 'VALIDATION_INVALID_TYPE_VARIABLE',
              },
            } as unknown as GraphQLError,
          ],
          status: 400,
          headers: {},
        },
        { query: 'query getSavedItemsByOffsetSimple...' },
      );
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.reject(err));

      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
      });
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: "invalid type for variable: 'pagination'",
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(sentrySpy).toHaveBeenCalledTimes(1);
    });
    it.each([
      // Add more test cases as implementation is updated
      {
        errData: {
          status: 403,
          message: 'Unauthorized',
          code: 'FORBIDDEN',
        },
        expected: {
          error: 'Unauthorized',
        },
      },
    ])(
      'Translates graphql errors but does not log to sentry/cloudwatch',
      async ({ errData, expected }) => {
        const consoleSpy = jest.spyOn(serverLogger, 'error');
        const sentrySpy = jest.spyOn(Sentry, 'captureException');
        const err = new ClientError(
          {
            errors: [
              {
                message: errData.message,
                extensions: {
                  code: errData.code,
                },
              } as unknown as GraphQLError,
            ],
            status: errData.status,
            headers: {},
          },
          { query: 'query getSavedItemsByOffsetSimple...' },
        );
        jest
          .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
          .mockImplementation(() => Promise.reject(err));

        const response = await request(app).get('/v3/get').query({
          consumer_key: 'test',
          access_token: 'test',
        });
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
        expect(response.status).toEqual(errData.status);
        expect(response.body).toEqual(expected);
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(sentrySpy).not.toHaveBeenCalled();
      },
    );
  });
  describe('schema validation', () => {
    it.each([
      { consumer_key: 'test', access_token: 'test', detailType: 'complete' },
      {
        consumer_key: 'test',
        access_token: 'test',
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
    it('should not log input validation errors to sentry or cloudwatch', async () => {
      const consoleSpy = jest.spyOn(serverLogger, 'error');
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      const response = await request(app).get('/v3/get').query({
        detailType: 'unknown',
        count: '10',
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(response.status).toBe(400);
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(sentrySpy).not.toHaveBeenCalled();
    });
    it('should convert since string to numeric', async () => {
      const apiSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        since: '123123',
        detailType: 'complete',
      });
      expect(apiSpy.mock.lastCall[3].filter.updatedSince).toEqual(123123);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it.each([
      { consumer_key: 'test', access_token: 'test', detailType: 'complete' },
      {
        consumer_key: 'test',
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
      const callSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).post('/v3/get').send(params);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(callSpy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });
    it.each([
      {
        consumer_key: '',
        detailType: 'simple',
      },
      {
        detailType: 'complete',
        count: '10',
        offset: '10',
        state: 'not-realstate',
        favorite: '0',
        tag: 'tag',
      },
      {
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
      // Duplicate query param case
      {
        tag: ['abc', '123'],
      },
    ])(
      'should work with invalid query parameters and not make request',
      async (query) => {
        const callSpy = jest.spyOn(
          GraphQLCalls,
          'callSavedItemsByOffsetComplete',
        );
        const response = await request(app).get('/v3/get').query(query);
        expect(callSpy).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      },
    );
    it.each([
      {
        params: {
          detailType: 'complete',
          consumer_key: 'test',
        },
        hasTotal: false,
      },
      {
        params: {
          detailType: 'complete',
          consumer_key: 'test',
          total: '1',
        },
        hasTotal: true,
      },
      {
        params: {
          detailType: 'complete',
          consumer_key: 'test',
          total: '0',
        },
        hasTotal: false,
      },
      {
        params: {
          detailType: 'simple',
          consumer_key: 'test',
        },
        hasTotal: false,
      },
      {
        params: {
          detailType: 'simple',
          consumer_key: 'test',
          total: '1',
        },
        hasTotal: true,
      },
      {
        params: {
          detailType: 'simple',
          consumer_key: 'test',
          total: '0',
        },
        hasTotal: false,
      },
    ])('appropriately returns total field', async ({ params, hasTotal }) => {
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.resolve(mockGraphGetSimple));
      jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetComplete')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphComplete));
      jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetSimple')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphSimple));
      const response = await request(app).get('/v3/get').query(params);
      if (hasTotal) {
        expect(response.body).toHaveProperty('total');
      } else {
        expect(response.body).not.toHaveProperty('total');
      }
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('relevance sort is not allowed sort for non-search', async () => {
      const callSpy = jest.spyOn(
        GraphQLCalls,
        'callSavedItemsByOffsetComplete',
      );
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        sort: 'relevance',
        detailType: 'complete',
      });
      expect(callSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('relevance sort is not allowed sort for invalid search term', async () => {
      const callSpy = jest.spyOn(
        GraphQLCalls,
        'callSavedItemsByOffsetComplete',
      );
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        sort: 'relevance',
        search: '',
        detailType: 'complete',
      });
      expect(callSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('relevance is a valid input for search term', async () => {
      jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetComplete')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphComplete));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: 'abc',
        sort: 'relevance',
        detailType: 'complete',
      });
      expect(response.status).toBe(200);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('defaults to relevance sort for search', async () => {
      const apiSpy = jest
        .spyOn(GraphQLCalls, 'callSearchByOffsetSimple')
        .mockImplementation(() => Promise.resolve(freeTierSearchGraphSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        search: 'abc',
      });
      expect(apiSpy.mock.lastCall[3].sort.sortBy).toEqual('RELEVANCE');
      expect(apiSpy.mock.lastCall[3].sort.sortOrder).toEqual('DESC');
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('defaults to newest sort for non-search', async () => {
      const apiSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.resolve(mockGraphGetSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
      });
      expect(apiSpy.mock.lastCall[3].sort.sortBy).toEqual('CREATED_AT');
      expect(apiSpy.mock.lastCall[3].sort.sortOrder).toEqual('DESC');
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
  });
});
