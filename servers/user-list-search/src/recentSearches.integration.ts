import { startServer } from './server/serverUtils';
import { ContextManager } from './server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import {
  knexDbReadClient,
  knexDbWriteClient,
} from './datasource/clients/knexClient';
import { Knex } from 'knex';
import { createHash } from 'node:crypto';
import { print } from 'graphql';
import {
  RECENT_SEARCHES_QUERY,
  SEARCH_OFFSET_QUERY,
  SEARCH_SAVED_ITEM_QUERY,
} from './queries';

describe('premium search functional test', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbReadClient();
  const dbWriter = knexDbWriteClient();
  const headers = {
    userid: '1',
    premium: 'true',
  };

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(
    async () => await db('readitla_ril-tmp.user_recent_search').truncate(),
  );

  afterAll(async () => {
    await server.stop();
    await db.destroy();
    await dbWriter.destroy();
  });

  it('should return no recent searches for User entity when none', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(RECENT_SEARCHES_QUERY),
        variables: { id: '1' },
      });
    const expected = [];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].recentSearches).toEqual(expected);
  });

  it.each([SEARCH_SAVED_ITEM_QUERY, SEARCH_OFFSET_QUERY])(
    'should return recent searches for User entity after searches are performed',
    async (searchQuery) => {
      await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(searchQuery),
          variables: { id: '1', term: 'apple' },
        });
      await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(searchQuery),
          variables: { id: '1', term: 'balloon' },
        });
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(RECENT_SEARCHES_QUERY),
          variables: { id: '1' },
        });
      // Recency order
      const expected = [
        { term: 'balloon', context: null },
        { term: 'apple', context: null },
      ];
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?._entities[0].recentSearches).toEqual(expected);
    },
  );
});
