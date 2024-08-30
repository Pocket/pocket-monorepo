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
  freeTierSearchGraphSimpleTagList,
  expectedFreeTierResponseSimpleTaglist,
  freeTierSearchGraphCompleteTagList,
  expectedFreeTierResponseCompleteTaglist,
  mockGraphGetSimpleTagsList,
  expectedGetSimpleTagslist,
  mockGraphGetCompleteTagsList,
  expectedGetCompleteTagslist,
  mockGraphGetSimpleFreeAccount,
  mockGraphGetCompleteFreeAccount,
  mockGraphGetSimplePremiumAccount,
  mockGraphGetCompletePremiumAccount,
  expectedGetSimpleFreeAccount,
  expectedGetSimplePremiumAccount,
  expectedGetCompletePremiumAccount,
  expectedGetCompleteFreeAccount,
  mockGraphGetSimpleFreeAccountNullFeatures,
  mockGraphGetCompleteFreeRecentSearches,
  mockGraphGetSimpleFreeRecentSearches,
  mockGraphGetSimplePremiumRecentSearches,
  mockGraphGetCompletePremiumRecentSearches,
  expectedGetCompletePremiumRecentSearches,
  expectedGetSimplePremiumRecentSearches,
  expectedGetSimple,
  expectedGetComplete,
  mockGraphGetSimplePremiumNoRecentSearches,
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
    jest.useFakeTimers({ now: 1706732550000, doNotFake: ['setImmediate'] });
  });
  afterAll(async () => {
    server.close();
    jest.useRealTimers();
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
  describe('with account/forceaccount option', () => {
    let clientSpy;
    afterEach(() => clientSpy.mockRestore());
    it.each([
      {
        requestData: {
          detailType: 'simple',
          forceaccount: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleFreeAccount,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimpleFreeAccount,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          account: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleFreeAccount,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimpleFreeAccount,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          account: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimplePremiumAccount,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimplePremiumAccount,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          forceaccount: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimplePremiumAccount,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimplePremiumAccount,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          forceaccount: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteFreeAccount,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompleteFreeAccount,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          account: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteFreeAccount,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompleteFreeAccount,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          account: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompletePremiumAccount,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompletePremiumAccount,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          forceaccount: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompletePremiumAccount,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompletePremiumAccount,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          account: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleFreeAccountNullFeatures,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimpleFreeAccount,
        },
      },
    ])(
      'makes request with account data',
      async ({ requestData, fixture, expected }) => {
        const requestSpy = jest.spyOn(GraphQLCalls, fixture.requestName);
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData)
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: 'test',
            access_token: 'test',
            since: 1712766000,
          });
        expect(response.body).toEqual(expected.response);
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][3]).toMatchObject({
          withAccountData: true,
        });
      },
    );
  });

  describe('with premium/forcepremium option', () => {
    let clientSpy;
    afterEach(() => clientSpy.mockRestore());
    it.each([
      {
        requestData: {
          detailType: 'simple',
          forcepremium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleFreeRecentSearches,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimple,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          premium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleFreeRecentSearches,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimple,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          premium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimplePremiumRecentSearches,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimplePremiumRecentSearches,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          forcepremium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimplePremiumRecentSearches,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimplePremiumRecentSearches,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          forcepremium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteFreeRecentSearches,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetComplete,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          forcepremium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteFreeRecentSearches,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetComplete,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          premium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompletePremiumRecentSearches,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompletePremiumRecentSearches,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          forcepremium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompletePremiumRecentSearches,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompletePremiumRecentSearches,
        },
      },
      {
        requestData: {
          detailType: 'simple',
          premium: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimplePremiumNoRecentSearches,
        },
        expected: {
          name: 'savedItemsSimple',
          response: { ...expectedGetSimple, recent_searches: [] },
        },
      },
    ])(
      'makes request with recent searches data',
      async ({ requestData, fixture, expected }) => {
        const requestSpy = jest.spyOn(GraphQLCalls, fixture.requestName);
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData)
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: 'test',
            access_token: 'test',
            since: 1712766000,
          });
        expect(response.body).toEqual(expected.response);
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][3]).toMatchObject({
          withRecentSearches: true,
        });
      },
    );
  });
  describe('with taglist option', () => {
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
          requestData: freeTierSearchGraphSimpleTagList,
        },
        expected: {
          name: 'searchSavedItemsSimple',
          response: expectedFreeTierResponseSimpleTaglist,
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
          requestData: freeTierSearchGraphCompleteTagList,
        },
        expected: {
          name: 'searchSavedItemsComplete',
          response: expectedFreeTierResponseCompleteTaglist,
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
          requestData: freeTierSearchGraphCompleteTagList,
        },
        expected: {
          name: 'searchSavedItemsComplete',
          response: {
            ...expectedFreeTierResponseCompleteTaglist,
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
          requestData: freeTierSearchGraphSimpleTagList,
        },
        expected: {
          name: 'searchSavedItemsSimple',
          response: {
            ...expectedFreeTierResponseSimpleTaglist,
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
          requestData: mockGraphGetSimpleTagsList,
        },
        expected: {
          name: 'savedItemsSimple',
          response: expectedGetSimpleTagslist,
        },
      },
      {
        requestData: {
          detailType: 'complete',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteTagsList,
        },
        expected: {
          name: 'savedItemsComplete',
          response: expectedGetCompleteTagslist,
        },
      },
      {
        requestData: {
          detailType: 'complete',
          total: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetComplete' as const,
          requestData: mockGraphGetCompleteTagsList,
        },
        expected: {
          name: 'savedItemsComplete',
          response: { ...expectedGetCompleteTagslist, total: '10' },
        },
      },
      {
        requestData: {
          detailType: 'simple',
          total: '1',
        },
        fixture: {
          requestName: 'callSavedItemsByOffsetSimple' as const,
          requestData: mockGraphGetSimpleTagsList,
        },
        expected: {
          name: 'savedItemsSimple',
          response: { ...expectedGetSimpleTagslist, total: '10' },
        },
      },
    ])(
      'makes request with taglist',
      async ({ requestData, fixture, expected }) => {
        const requestSpy = jest.spyOn(GraphQLCalls, fixture.requestName);
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData)
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: 'test',
            access_token: 'test',
            taglist: '1',
            since: 1712766000,
          });
        expect(response.body).toEqual(expected.response);
        expect(requestSpy).toHaveBeenCalledTimes(1);
        expect(requestSpy.mock.calls[0][3]).toMatchObject({
          withTagsList: true,
          tagListSince: '2024-04-10T16:20:00.000Z',
        });
        const forceResponse = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: 'test',
            access_token: 'test',
            forcetaglist: '1',
            since: 1712766000,
          });
        expect(forceResponse.body).toEqual(expected.response);
        expect(requestSpy).toHaveBeenCalledTimes(2);
        expect(requestSpy.mock.calls[1][3]).toMatchObject({
          withTagsList: true,
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
          headers: {
            'x-source': 'Pocket',
            'x-error-code': '5200',
            'x-error': 'Forbidden',
          },
        },
      },
      // Fallback to generic report
      {
        errData: {
          status: 504,
          message: "HTTP fetch failed from 'parser': 504: Gateway Timeout",
          code: 'SUBREQUEST_HTTP_ERROR',
        },
        expected: {
          error: "HTTP fetch failed from 'parser': 504: Gateway Timeout",
          headers: {
            'x-source': 'Pocket',
            'x-error': 'Internal Server Error',
            'x-error-code': '198',
          },
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
        expect(response.headers).toMatchObject(expected.headers);
        expect(response.status).toEqual(errData.status);
        expect(response.body.error).toEqual(expected.error);
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
        sort: 'longest',
        since: '12345',
      },
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
        sort: 'shortest',
        since: '12345',
      },
      {
        consumer_key: 'test',
        access_token: 'test',
        detailType: 'complete',
        contentType: 'all',
        count: '10',
        offset: '10',
        state: 'read',
        favorite: '0',
        tag: 'tag',
        sort: 'shortest',
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
      expect(apiSpy.mock.lastCall?.[3].filter?.updatedSince).toEqual(123123);
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('should not add contentType filter if value="all"', async () => {
      const apiSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
        .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        detailType: 'complete',
      });
      expect(apiSpy.mock.lastCall?.[3].filter).toBeUndefined();
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it.each([
      1719263946000,
      1719263946,
      '1719263946000',
      '1719263946',
      '1719263946.129312',
      1719263946.129312,
    ])(
      'should convert since milliseconds to seconds, but leave seconds alone',
      async (time) => {
        const apiSpy = jest
          .spyOn(GraphQLCalls, 'callSavedItemsByOffsetComplete')
          .mockImplementation(() => Promise.resolve(mockGraphGetComplete));
        const response = await request(app).get('/v3/get').query({
          consumer_key: 'test',
          access_token: 'test',
          since: time,
          detailType: 'complete',
        });
        expect(apiSpy.mock.lastCall?.[3].filter?.updatedSince).toEqual(
          1719263946,
        );
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      },
    );
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
      // since < 0
      {
        consumer_key: 'test',
        access_token: 'test',
        since: '-1233',
      },
      {
        consumer_key: 'test',
        access_token: 'test',
        since: '-1233.343',
      },
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
    it('relevance sort is converted to "newest" for non-search', async () => {
      const callSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.resolve(mockGraphGetSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        sort: 'relevance',
        detailType: 'simple',
      });
      expect(callSpy).toHaveBeenCalled();
      expect(callSpy.mock.calls[0][3]).toMatchObject({
        sort: {
          sortBy: 'CREATED_AT',
          sortOrder: 'DESC',
        },
      });
      expect(response.status).toBe(200);
    });
    it('relevance sort is converted to "newest" for invalid search term', async () => {
      const callSpy = jest
        .spyOn(GraphQLCalls, 'callSavedItemsByOffsetSimple')
        .mockImplementation(() => Promise.resolve(mockGraphGetSimple));
      const response = await request(app).get('/v3/get').query({
        consumer_key: 'test',
        access_token: 'test',
        sort: 'relevance',
        search: '',
        detailType: 'simple',
      });
      expect(callSpy).toHaveBeenCalled();
      expect(callSpy.mock.calls[0][3]).toMatchObject({
        sort: {
          sortBy: 'CREATED_AT',
          sortOrder: 'DESC',
        },
      });
      expect(response.status).toBe(200);
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
      expect(apiSpy.mock.lastCall?.[3].sort?.sortBy).toEqual('RELEVANCE');
      expect(apiSpy.mock.lastCall?.[3].sort?.sortOrder).toEqual('DESC');
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
      expect(apiSpy.mock.lastCall?.[3].sort?.sortBy).toEqual('CREATED_AT');
      expect(apiSpy.mock.lastCall?.[3].sort?.sortOrder).toEqual('DESC');
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
  });
  describe('for extensions', () => {
    // Weird but intentional prod behavior:
    //  * search + taglist will discard search results
    //  * taglist + total does not return total field
    // We won't bother faithfully replicating and testing this,
    // since it's for extensions and really doesn't make sense;
    // they shouldn't make requests like this (and we have control)
    let clientSpy;
    afterEach(() => clientSpy.mockRestore());
    it.each([
      {
        requestData: {
          detailType: 'simple',
        },
        fixture: {
          requestData: mockGraphGetSimpleTagsList,
        },
        responseData: expectedGetSimpleTagslist,
      },
      {
        requestData: {
          detailType: 'complete',
        },
        fixture: {
          requestData: mockGraphGetCompleteTagsList,
        },
        responseData: expectedGetCompleteTagslist,
      },
    ])(
      "doesn't return list data if taglist is specified",
      async ({ requestData, fixture, responseData }) => {
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: '7035-test',
            access_token: 'test',
            taglist: '1',
            since: 1712766000,
          });
        delete responseData['list'];
        expect(response.body).toEqual(responseData);
      },
    );
    it.each([
      {
        requestData: {
          detailType: 'simple',
          forcetaglist: '1',
        },
        fixture: {
          requestData: mockGraphGetSimple,
        },
        responseData: expectedGetSimple,
      },
      {
        requestData: {
          detailType: 'complete',
        },
        fixture: {
          requestData: mockGraphGetComplete,
        },
        responseData: expectedGetComplete,
      },
      {
        requestData: {
          detailType: 'simple',
          forceaccount: '1',
        },
        fixture: {
          requestData: mockGraphGetSimpleFreeAccount,
        },
        responseData: expectedGetSimpleFreeAccount,
      },
    ])(
      'returns list data if taglist is not specified (including forcetaglist... yes...)',
      async ({ requestData, fixture, responseData }) => {
        clientSpy = jest
          .spyOn(GraphQLClient.prototype, 'request')
          .mockResolvedValueOnce(fixture.requestData);
        const response = await request(app)
          .get('/v3/get')
          .query({
            ...requestData,
            consumer_key: '7035-test',
            access_token: 'test',
          });
        expect(response.body).toEqual(responseData);
      },
    );
  });
});
