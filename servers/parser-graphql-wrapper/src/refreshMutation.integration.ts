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
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
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

    // second call
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
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
    const GET_ITEM_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          title
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
      .send({ query: print(GET_ITEM_BY_URL), variables });
    expect(res).not.toBeNull();
    expect(res.body.data.getItemByUrl.title).toBe('first title');

    const refreshResponse = await request(app)
      .post(graphQLUrl)
      .send({ query: print(REFRESH_ITEM_BY_URL), variables });
    expect(refreshResponse).not.toBeNull();
    expect(refreshResponse.body.data.refreshItemArticle.title).toBe(
      'new title',
    );

    const secondQueryResponse = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEM_BY_URL), variables });
    expect(secondQueryResponse).not.toBeNull();
    expect(secondQueryResponse.body.data.getItemByUrl.title).toBe('new title');
  });
});
