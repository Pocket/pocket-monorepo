import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import nock, { cleanAll } from 'nock';
import { getRedis } from '../../cache';
import { MediaTypeParam, ParserAPI } from '../../datasources/ParserAPI';
import { setTimeout } from 'timers/promises';
import { IContext } from '../../apollo/context';
import Keyv from 'keyv';
import { Application } from 'express';

const GET_ARTICLE = gql`
  query getArticle($url: String!) {
    getItemByUrl(url: $url) {
      article
    }
  }
`;
const GET_ARTICLE_MARTICLE = gql`
  query getArticle($url: String!) {
    getItemByUrl(url: $url) {
      article
      marticle {
        __typename
      }
    }
  }
`;

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

/**
 * Little helper function for building the query string with
 * defaults.
 */
function buildQueryAndCacheKey(
  url: string,
  refresh?: boolean,
  imageStyle?: MediaTypeParam,
  videoStyle?: MediaTypeParam,
) {
  const params = {
    ...ParserAPI.defaultParams,
    url: url,
    refresh: refresh,
    images: imageStyle ?? ParserAPI.defaultParams.images,
    videos: videoStyle ?? ParserAPI.defaultParams.videos,
  };
  return ParserAPI.buildQueryString(params);
}

/**
 * Another helper for setting up the nocks since they have to be repeated.
 */
function nockerHelper(fakeData: any, url: string, refresh?: boolean) {
  const { query } = buildQueryAndCacheKey(
    url,
    refresh,
    MediaTypeParam.DIV_TAG,
    MediaTypeParam.DIV_TAG,
  );
  const textMock = nock('http://example-parser.com', {
    encodedQueryParams: false,
  })
    .get(`/?${query}`)
    .reply(200, fakeData);

  const marticleQuery = buildQueryAndCacheKey(url).query;
  const marticleTextMock = nock('http://example-parser.com', {
    encodedQueryParams: false,
  })
    .get(`/?${marticleQuery}`)
    .reply(200, fakeData);

  // Set up for getItem request
  const getItemMock = nock('http://example-parser.com', {
    encodedQueryParams: false,
  })
    .get('/')
    .query({
      url: url,
      output: 'regular',
      getItem: '1',
      enableItemUrlFallback: '1',
    })
    .reply(200, {
      item: {
        given_url: url,
        authors: {
          '1': { author_id: '1', name: 'botnik', url: 'some-url.com' },
        },
        has_image: '0',
        has_video: '1',
        resolved_id: '1',
        item_id: '1',
        response_code: '200',
        content_length: '140511',
      },
    });
  return { textMock, getItemMock, marticleTextMock };
}

const fakeArticle = {
  isArticle: 1,
  article: `<p>"Not so handsome now", thought Harry as he dipped Hermione in hot sauce. The Death Eaters were dead now, and Harry was hungier than he'd ever been.</p>`,
  item: {
    given_url: 'https://botnik.org/content/harry-potter.html',
  },
  images: { 1: { src: 'https://image-cache.com/1234' } },
  videos: null,
};
const newFakeArticle = {
  isArticle: 1,
  article: `<p>Ron was going to be spiders. He just was. He wasn't proud of that, but it was going to be hard to not have spiders all over his body after all is said and done.</p><div><!--RIL_IMG_1--></div>`,
  item: {
    given_url: 'https://botnik.org/content/harry-potter.html',
  },
  images: { 1: { src: 'https://image-cache.com/1234' } },
  videos: null,
};

describe('ParserAPI DataSource', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let cache: Keyv;
  const url = 'https://botnik.org/content/harry-potter.html';
  const getArticleSpy = jest.spyOn(ParserAPI.prototype, 'getArticleByUrl');

  beforeAll(async () => {
    cache = getRedis();
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  beforeEach(async () => {
    getArticleSpy.mockClear();
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
    const { textMock, getItemMock } = nockerHelper(newFakeArticle, url);
    const { cacheKey } = buildQueryAndCacheKey(
      url,
      false,
      MediaTypeParam.DIV_TAG,
      MediaTypeParam.DIV_TAG,
    );
    await cache.set(cacheKey, JSON.stringify(fakeArticle));
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.isDone()).toEqual(false); // shouldn't have made a request
    expect(getItemMock.isDone()).toEqual(true);
    expect(result.body.data.getItemByUrl.article).toEqual(fakeArticle.article);
    const cachedResult = JSON.parse(await cache.get(cacheKey)).article;
    expect(cachedResult).toEqual(fakeArticle.article); // shouldn't have updated cache
  });
  it('should retrieve item from endpoint if cache is expired, and cache it', async () => {
    const { textMock, getItemMock } = nockerHelper(newFakeArticle, url);
    const { cacheKey } = buildQueryAndCacheKey(
      url,
      false,
      MediaTypeParam.DIV_TAG,
      MediaTypeParam.DIV_TAG,
    );
    await cache.set(cacheKey, JSON.stringify(fakeArticle), 1);
    await setTimeout(1500);
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.isDone()).toEqual(true); // should have made request
    expect(getItemMock.isDone()).toEqual(true);
    expect(result.body.data.getItemByUrl.article).toEqual(
      newFakeArticle.article,
    );
    const cachedResult = JSON.parse(await cache.get(cacheKey)).article;
    expect(cachedResult).toEqual(newFakeArticle.article); // should have updated cache
  });
  it('should retrieve item from endpoint if key is not in cache, and cache it', async () => {
    const { textMock, getItemMock } = nockerHelper(newFakeArticle, url);
    const { cacheKey } = buildQueryAndCacheKey(
      url,
      false,
      MediaTypeParam.DIV_TAG,
      MediaTypeParam.DIV_TAG,
    );
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE), variables: { url: url } });
    expect(textMock.isDone()).toEqual(true); // should have made request
    expect(getItemMock.isDone()).toEqual(true);
    expect(result.body.data.getItemByUrl.article).toEqual(
      newFakeArticle.article,
    );
    const cachedResult = JSON.parse(await cache.get(cacheKey)).article;
    expect(cachedResult).toEqual(newFakeArticle.article);
  });
  it('should update the cached response when refresh=true, and return updated response', async () => {
    const { textMock, getItemMock } = nockerHelper(newFakeArticle, url, true);
    const { cacheKey } = buildQueryAndCacheKey(
      url,
      true,
      MediaTypeParam.DIV_TAG,
      MediaTypeParam.DIV_TAG,
    );
    await cache.set(cacheKey, JSON.stringify(fakeArticle));
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(REFRESH_ARTICLE), variables: { url: url } });
    expect(textMock.isDone()).toEqual(true); // should have made request
    expect(getItemMock.isDone()).toEqual(true);
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
    const cachedResult = JSON.parse(await cache.get(cacheKey)).article;
    expect(cachedResult).toEqual(newFakeArticle.article); // should have updated cache
    // Should have made 2 calls to fetch; While we wish it was 1 to reuse `article`, field from parent resolver
    // we can't because MArticle makes a different request.
    expect(getArticleSpy).toHaveBeenCalledTimes(2);
  });
  it('should load multiple requests to resolve article text in same application tick only once', async () => {
    // testing the dataloader is working properly
    const { textMock, getItemMock } = nockerHelper(newFakeArticle, url);
    const { cacheKey } = buildQueryAndCacheKey(url);
    const result = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ARTICLE_MARTICLE), variables: { url: url } });
    expect(textMock.isDone()).toEqual(true); // should have made request since there's no cache hit
    expect(getItemMock.isDone()).toEqual(true);
    // Should have only made 2 calls to the API due to dataloader batching
    // While we wish it was 1 we can't because MArticle makes a different request.
    expect(getArticleSpy).toHaveBeenCalledTimes(2);
    expect(result.body.data.getItemByUrl.article).toEqual(
      newFakeArticle.article,
    );
    // We really just care that the method got called and something was parsed
    expect(result.body.data.getItemByUrl.marticle).toEqual([
      { __typename: 'MarticleText' },
      { __typename: 'Image' },
    ]);
    const cachedResult = JSON.parse(await cache.get(cacheKey)).article;
    expect(cachedResult).toEqual(newFakeArticle.article);
  });
});
