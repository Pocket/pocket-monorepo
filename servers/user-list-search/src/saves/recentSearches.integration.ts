import { startServer } from '../server/serverUtils';
import { ContextManager } from '../server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import {
  knexDbReadClient,
  knexDbWriteClient,
} from '../datasource/clients/knexClient';
import { print } from 'graphql';
import {
  RECENT_SEARCHES_QUERY,
  SAVE_RECENT_SEARCH,
} from '../test/queries/operations';

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

  it('should return recent searches for User entity after searches are saved', async () => {
    await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_RECENT_SEARCH),
        variables: { search: { term: 'apple' } },
      });
    await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_RECENT_SEARCH),
        variables: { search: { term: 'balloon' } },
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
  });
  it('should return recent searches for User entity in timestamp order', async () => {
    await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_RECENT_SEARCH),
        variables: {
          search: { term: 'apple', timestamp: new Date(1714605569000) },
        },
      });
    await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_RECENT_SEARCH),
        variables: {
          search: { term: 'balloon', timestamp: new Date(1714605559000) },
        },
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
      { term: 'apple', context: null },
      { term: 'balloon', context: null },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].recentSearches).toEqual(expected);
  });
});
