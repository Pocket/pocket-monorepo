import { ContextManager } from '../server/context';
import { Request } from 'express';
import { Knex } from 'knex';
import { eventBridgeClient } from './client';
import { EventBus } from './EventBus';
import {
  CorpusLanguage,
  CorpusSearchConnection,
  QuerySearchCorpusArgs,
} from '../__generated__/types';
import { SearchResponseEvent1 } from '../snowtype/snowplow';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('EventBus', () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: 1673445238335 });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  const client = eventBridgeClient();
  describe('CorpusSearchEvent', () => {
    const dbClient = jest.fn() as unknown as Knex;
    const args: QuerySearchCorpusArgs = {
      filter: { language: CorpusLanguage.En, excludeCollections: true },
      search: { query: 'slime molds consciousness' },
    };
    const result: CorpusSearchConnection = {
      totalCount: 2,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges: [
        {
          cursor: 'abc123',
          node: {
            url: 'https://fantasticslimes.com',
          },
        },
        {
          cursor: 'def928',
          node: {
            url: 'https://philosophydive.com',
          },
        },
      ],
    };
    const headers = {
      userid: '123456',
      encodedid: 'abc123def456',
      guid: '987654',
      encodedguid: 'zyx987wvu654',
      apiid: '999',
      applicationisnative: 'true',
      applicationistrusted: 'true',
    };
    const anonHeader = {
      ...headers,
      userid: 'anonymous',
      encodedid: undefined,
    };
    const anonMissing = {
      ...headers,
      userid: undefined,
      encodedid: undefined,
    };
    const loggedInContext = new ContextManager(
      { headers } as unknown as Request,
      dbClient,
    );
    const anonymousContext = new ContextManager(
      { headers: anonHeader } as unknown as Request,
      dbClient,
    );
    const anonMissingContext = new ContextManager(
      { headers: anonMissing } as unknown as Request,
      dbClient,
    );
    it.each([
      {
        context: loggedInContext,
        expected: {
          user: {
            user_id: 123456,
            hashed_user_id: 'abc123def456',
            guid: 987654,
            hashed_guid: 'zyx987wvu654',
          },
          apiUser: {
            api_id: 999,
            is_native: true,
            is_trusted: true,
          },
        },
      },
      {
        context: anonymousContext,
        expected: {
          user: {
            user_id: undefined,
            hashed_user_id: undefined,
            guid: 987654,
            hashed_guid: 'zyx987wvu654',
          },
          apiUser: {
            api_id: 999,
            is_native: true,
            is_trusted: true,
          },
        },
      },
      {
        context: anonMissingContext,
        expected: {
          user: {
            user_id: undefined,
            hashed_user_id: undefined,
            guid: 987654,
            hashed_guid: 'zyx987wvu654',
          },
          apiUser: {
            api_id: 999,
            is_native: true,
            is_trusted: true,
          },
        },
      },
    ])('builds event out of context info', ({ context, expected }) => {
      const search: SearchResponseEvent1 = {
        id: expect.toBeString(),
        result_count_total: 2,
        result_urls: [
          'https://fantasticslimes.com',
          'https://philosophydive.com',
        ],
        returned_at: 1673445238,
        search_query: {
          query: 'slime molds consciousness',
          scope: 'all_contentful',
          filter: ['excludeCollections'],
        },
        search_type: 'corpus_en',
      };
      const event = new EventBus(client).buildCorpusSearchResultEvent(
        result,
        context,
        args,
      );
      expect(event).toEqual({ search, ...expected });
    });
    describe('unhappy paths', () => {
      let clientSpy: jest.SpyInstance;
      let sentrySpy: jest.SpyInstance;
      let loggerSpy: jest.SpyInstance;
      beforeEach(() => {
        sentrySpy = jest.spyOn(Sentry, 'captureException');
        loggerSpy = jest.spyOn(serverLogger, 'error');
        clientSpy = jest
          .spyOn(EventBridgeClient.prototype, 'send')
          .mockImplementation(() => Promise.reject(new Error('sike')));
      });
      afterEach(() => {
        clientSpy.mockRestore();
        sentrySpy.mockRestore();
        loggerSpy.mockRestore();
      });
      it('logs error if invalid language somehow is passed', () => {
        const context = new ContextManager(
          { headers } as unknown as Request,
          dbClient,
        );
        new EventBus(client).buildCorpusSearchResultEvent(
          result,
          context,
          // Forcibly mocking a state where we might have a Corpus language enum
          // but haven't set the corpus index map value in the method yet
          {
            ...args,
            filter: { language: 'zz' as unknown as CorpusLanguage },
          },
        );
        expect(sentrySpy).toHaveBeenCalledOnce();
        expect(loggerSpy).toHaveBeenCalledOnce();
        expect(loggerSpy.mock.calls[0][0].message).toEqual(
          'Attempted to log search for invalid language',
        );
        expect(loggerSpy.mock.calls[0][0].language).toEqual('zz');
      });
      it('logs error if event fails to send', async () => {
        const client = new EventBridgeClient();
        const context = new ContextManager(
          { headers } as unknown as Request,
          dbClient,
        );
        await new EventBus(client).sendCorpusSearchResultEvent(
          result,
          context,
          args,
        );
        expect(sentrySpy).toHaveBeenCalledOnce();
        expect(loggerSpy).toHaveBeenCalledOnce();
        expect(loggerSpy.mock.calls[0][0].error).toEqual(
          'Failed to send event to event bus',
        );
        expect(loggerSpy.mock.calls[0][0].message).toEqual('sike');
      });
    });
  });
});
