import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { cleanAll } from 'nock';
import { getRedis } from '../../cache';
import { IContext } from '../../apollo/context';
import Keyv from 'keyv';
import { Application } from 'express';
import {
  cacheParserResponse,
  fakeArticle,
  getCachedParserResponse,
  newFakeArticle,
  nockThreeStandardParserResponses,
} from '../utils/parserResponse';
import { setTimeout } from 'timers/promises';

const GET_ARTICLE = gql`
  query getArticle($url: String!) {
    itemByUrl(url: $url) {
      article
    }
  }
`;

describe('ParserAPI DataSource', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let cache: Keyv;
  const url = 'https://botnik.org/content/harry-potter.html';

  beforeAll(async () => {
    cache = getRedis();
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  beforeEach(async () => {
    await cache.clear();
  });
  afterEach(() => {
    cleanAll();
  });
  afterAll(async () => {
    await cache.disconnect();
    await server.stop();
  });
  it('should retrieve item from cache if it exists and is not expired', async () => {
    // Nock a new article to ensure no refreshing
    const { textMock, getItemMock, marticleTextMock } =
      nockThreeStandardParserResponses(newFakeArticle, url);

    // Cache an old article
    // cache the itemByUrl call
    await cacheParserResponse(
      getItemMock.params.cacheKey,
      { ...fakeArticle, article: undefined },
      cache,
    );

    // cache the text call
    await cacheParserResponse(textMock.params.cacheKey, fakeArticle, cache);

    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.scope.isDone()).toEqual(false); // shouldn't have made a request because we cached it
    expect(getItemMock.scope.isDone()).toEqual(false); // doesn't request item because we cached it
    expect(marticleTextMock.scope.isDone()).toEqual(false); // doesn't ask for marticle because we didn't ask for it
    expect(result.body.data.itemByUrl.article).toEqual(fakeArticle.article);
    const cachedResult = (
      await getCachedParserResponse(textMock.params.cacheKey, cache)
    ).article;
    expect(cachedResult).toEqual(fakeArticle.article); // shouldn't have updated cache
  });
  it('should retrieve item from endpoint if cache is expired, and cache it', async () => {
    const { textMock, getItemMock, marticleTextMock } =
      nockThreeStandardParserResponses(newFakeArticle, url);

    // cache the itemByUrl call
    await cacheParserResponse(
      getItemMock.params.cacheKey,
      { ...fakeArticle, article: undefined },
      cache,
      1,
    );
    // cache the text call
    await cacheParserResponse(textMock.params.cacheKey, fakeArticle, cache, 1);

    await setTimeout(1500);
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.scope.isDone()).toEqual(true); // should have made request
    expect(getItemMock.scope.isDone()).toEqual(true); // should have made request
    expect(marticleTextMock.scope.isDone()).toEqual(false); // doesn't ask for marticle because we didn't ask for it
    expect(result.body.data.itemByUrl.article).toEqual(newFakeArticle.article);
    const cachedResult = (
      await getCachedParserResponse(textMock.params.cacheKey, cache)
    ).article;
    expect(cachedResult).toEqual(newFakeArticle.article); // should have updated cache
  });
  it('should retrieve item from endpoint if key is not in cache, and cache it', async () => {
    const { textMock, getItemMock } = nockThreeStandardParserResponses(
      newFakeArticle,
      url,
    );
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.scope.isDone()).toEqual(true); // should have made request
    expect(getItemMock.scope.isDone()).toEqual(true);
    expect(result.body.data.itemByUrl.article).toEqual(newFakeArticle.article);
    const cachedResult = (
      await getCachedParserResponse(textMock.params.cacheKey, cache)
    ).article;
    expect(cachedResult).toEqual(newFakeArticle.article);
  });
});
