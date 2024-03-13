import request from 'supertest';
import * as Sentry from '@sentry/node';
import * as GraphQLCalls from '../graph/graphQLClient';
import { serverLogger } from '@pocket-tools/ts-logger';
import { setTimeout } from 'timers/promises';
import { mockGraphGetComplete } from '../test/fixtures';
import { ClientError } from 'graphql-request';
import { GraphQLError } from 'graphql-request/build/esm/types';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';

describe('v3Fetch', () => {
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

  describe('fetch call', () => {
    it('GET should log to Sentry and throw 5xx for unknown errors', async () => {
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => {
          throw new Error('test error');
        });
      const response = await request(app).get('/v3/fetch').query({
        consumer_key: 'test',
        access_token: 'test',
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
      const response = await request(app).post('/v3/fetch').send({
        consumer_key: 'test',
        access_token: 'test',
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
        { query: 'query getSavedItemsByOffsetComplete...' },
      );
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.reject(err));

      const response = await request(app).get('/v3/fetch').query({
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
          { query: 'query getSavedItemsByOffsetComplete...' },
        );
        jest
          .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
          .mockImplementation(() => Promise.reject(err));

        const response = await request(app).get('/v3/fetch').query({
          consumer_key: 'test',
          access_token: 'test',
        });
        expect(response.status).toEqual(errData.status);
        expect(response.body).toEqual(expected);
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(sentrySpy).not.toHaveBeenCalled();
      },
    );
  });
  describe('schema validation', () => {
    it.each([
      { consumer_key: 'test', access_token: 'test' },
      {
        consumer_key: 'test',
        access_token: 'test',
        offset: '6',
        count: '28',
      },
    ])('should work with valid query parameters (Fetch)', async (params) => {
      jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).get('/v3/fetch').query(params);
      expect(response.status).toBe(200);
    });
    it('should not log input validation errors to sentry or cloudwatch', async () => {
      const consoleSpy = jest.spyOn(serverLogger, 'error');
      const sentrySpy = jest.spyOn(Sentry, 'captureException');
      const response = await request(app).get('/v3/fetch').query({
        count: '-10',
      });
      expect(response.status).toBe(400);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(sentrySpy).not.toHaveBeenCalled();
    });
    it.each([
      { consumer_key: 'test', access_token: 'test' },
      {
        consumer_key: 'test',
        access_token: 'test',
        offet: '6',
        count: '90',
      },
      {
        consumer_key: 'test',
        access_token: 'test',
        offet: 8,
        count: 91,
      },
    ])('should work with valid body parameters (POST)', async (params) => {
      const callSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).post('/v3/fetch').send(params);
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
        tag: 'tag',
      },
      {
        detailType: 'ultra-hd',
        count: '100000',
        offset: '-10',
      },
      // Duplicate query param case
      {
        offset: ['abc', '123'],
      },
    ])(
      'should work with invalid query parameters and not make request',
      async (query) => {
        const callSpy = jest.spyOn(
          GraphQLCalls,
          'callSavedItemsByOffsetComplete',
        );
        const response = await request(app).get('/v3/fetch').query(query);
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
        expect(callSpy).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
      },
    );
  });
});
