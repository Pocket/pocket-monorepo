import { ApolloServer } from '@apollo/server';
import nock from 'nock';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { IContext } from './context';
import { getConnection, getSharedUrlsConnection } from './database/mysql';
import { getRedis } from './cache';
import { startServer } from './server';

describe('refresh mutation', () => {
  const testUrl = 'https://someurl.com';
  const variables = {
    url: testUrl,
  };

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  afterAll(async () => {
    await server.stop();
    await (await getConnection()).destroy();
    await (await getSharedUrlsConnection()).destroy();
    await getRedis().disconnect();
  });

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(async () => {
    // Flush the redis cache before each test
    await getRedis().clear();
    //first call for getItemByUrl.
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular&enableItemUrlFallback=1`,
      )
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          title: 'first title',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });

    // second call to refresh
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular&images=2&videos=2&createIfNone=true&refresh=true`,
      )
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          title: 'new title',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });

    //third call used by refresh aritcle.
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular&enableItemUrlFallback=1`,
      )
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          title: 'new title',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });

    // final call used by the refrence resolver.
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular&enableItemUrlFallback=1`,
      )
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          title: 'new title',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });
  });

  it('should return updated title from query', async () => {
    const REFRENCE_RESOLVER = gql`
      query ($representations: [_Any!]!) {
        _entities(representations: $representations) {
          ... on Item {
            title
          }
        }
      }
    `;

    const REFRESH_ITEM_BY_URL = gql`
      mutation refreshItemArticle($url: String!) {
        refreshItemArticle(url: $url) {
          title
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(REFRENCE_RESOLVER),
        variables: {
          representations: [
            {
              __typename: 'Item',
              givenUrl: testUrl,
            },
          ],
        },
      });
    expect(res).not.toBeNull();
    expect(res.body.data._entities[0].title).toBe('first title');

    const refreshResponse = await request(app)
      .post(graphQLUrl)
      .send({ query: print(REFRESH_ITEM_BY_URL), variables });
    expect(refreshResponse).not.toBeNull();
    expect(refreshResponse.body.data.refreshItemArticle.title).toBe(
      'new title',
    );

    const secondQueryResponse = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(REFRENCE_RESOLVER),
        variables: {
          representations: [
            {
              __typename: 'Item',
              givenUrl: testUrl,
            },
          ],
        },
      });
    expect(secondQueryResponse).not.toBeNull();
    expect(secondQueryResponse.body.data._entities[0].title).toBe('new title');
  });
});
