import { ApolloServer } from '@apollo/server';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { IContext } from '../../apollo/context';
import {
  getConnection,
  getSharedUrlsConnection,
} from '../../datasources/mysql';
import { getRedis } from '../../cache';
import { startServer } from '../../apollo/server';
import {
  cacheParserResponse,
  fakeArticle,
  getCachedParserResponse,
  newFakeArticle,
  nockResponseForParser,
  nockThreeStandardParserResponses,
} from '../utils/parserResponse';
import { BoolStringParam } from '../../datasources/ParserAPI';
import Keyv from 'keyv';

describe('refresh mutation', () => {
  const testUrl = 'https://someurl.com';
  const variables = {
    url: testUrl,
  };

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let cache: Keyv;

  afterAll(async () => {
    await server.stop();
    await (await getConnection()).destroy();
    await (await getSharedUrlsConnection()).destroy();
    cache.disconnect();
  });

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
    cache = getRedis();
  });

  beforeEach(async () => {
    // Flush the redis cache before each test
    await cache.clear();
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

    const firstRequest = nockResponseForParser(testUrl, {
      data: { title: 'first title' },
    });

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

    nockResponseForParser(testUrl, {
      data: { ...firstRequest.data, title: 'new title' },
      parserOptions: { refresh: BoolStringParam.TRUE },
    });
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

  it('should update the cached response when refresh=true, and return updated response', async () => {
    const url = 'https://botnik.org/content/harry-potter.html';
    const REFRESH_ARTICLE = gql`
      mutation refreshArticle($url: String!) {
        refreshItemArticle(url: $url) {
          givenUrl
          article
          marticle {
            __typename
          }
          authors {
            name
          }
        }
      }
    `;
    const { textMock, getItemMock, marticleTextMock } =
      nockThreeStandardParserResponses(newFakeArticle, url, true);
    await cacheParserResponse(
      getItemMock.params.cacheKey,
      { ...fakeArticle, article: undefined },
      cache,
    );
    await cacheParserResponse(
      textMock.params.cacheKey,
      { ...fakeArticle },
      cache,
    );
    await cacheParserResponse(
      marticleTextMock.params.cacheKey,
      { ...fakeArticle },
      cache,
    );

    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(REFRESH_ARTICLE), variables: { url: url } });
    expect(textMock.scope.isDone()).toEqual(true); // should have made request
    expect(getItemMock.scope.isDone()).toEqual(true);
    expect(marticleTextMock.scope.isDone()).toEqual(true);

    expect(result.body.data.refreshItemArticle.article).toEqual(
      newFakeArticle.article,
    );
    expect(result.body.data.refreshItemArticle.marticle).toEqual([
      { __typename: 'MarticleText' },
      { __typename: 'Image' },
    ]);
    // Should also have resolved item data
    expect(result.body.data.refreshItemArticle.authors).toEqual([
      { name: 'botnik' },
    ]);
    const cachedResult = (
      await getCachedParserResponse(textMock.params.cacheKey, cache)
    ).article;
    expect(cachedResult).toEqual(newFakeArticle.article);
  });
});
