import { startServer } from './server/serverUtils';
import { ContextManager } from './server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { knexDbClient } from './datasource/clients/knexClient';
import { Knex } from 'knex';
import { createHash } from 'node:crypto';

type UserRecentSearch = {
  search: string;
  contextKey: string;
  contextValue: string;
  timeAdded: Date;
  searchHash: string;
  userId: string;
};

const defaultSearchValues: Omit<UserRecentSearch, 'searchHash'> = {
  search: 'apple',
  contextKey: '',
  contextValue: '',
  timeAdded: new Date(),
  userId: '1',
};

async function loadSearchTerm(
  searchValues: Partial<UserRecentSearch>,
  db: Knex,
) {
  searchValues = {
    ...defaultSearchValues,
    ...searchValues,
  };
  const seachHash = createHash('sha1')
    .update(
      `${searchValues.search}${searchValues.contextKey}${searchValues.contextValue}`,
    )
    .digest('hex');
  await db('readitla_ril-tmp.user_recent_search').insert({
    search: searchValues.search,
    context_key: searchValues.contextKey,
    context_value: searchValues.contextValue,
    user_id: searchValues.userId,
    time_added: searchValues.timeAdded.getTime(),
    search_hash: seachHash,
  });
}

describe('premium search functional test', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbClient();
  const headers = {
    userid: '1',
    premium: 'true',
  };
  const RECENT_SEARCHES_QUERY = `
    query recentSearches($id: ID!) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          recentSearches {
            term
            context {
              key
              value
            }
            timeAdded
          }
        }
      }
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await db('readitla_ril-tmp.list').truncate();
    await db('readitla_b.items_extended').truncate();
  });

  afterAll(async () => {
    await server.stop();
    await db.destroy();
  });

  it('should return no recent searches for User entity when none', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: RECENT_SEARCHES_QUERY,
        variables: { id: '1' },
      });
    const expected = [];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].recentSearches).toIncludeSameMembers(
      expected,
    );
  });

  it('should return recent searches for User entity when there are some', async () => {
    await loadSearchTerm({ search: 'balloon' }, db);
    await loadSearchTerm({ search: 'apple' }, db);
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: RECENT_SEARCHES_QUERY,
        variables: { id: '1' },
      });
    const expected = ['balloon', 'apple'];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].recentSearches).toIncludeSameMembers(
      expected,
    );
  });
});
