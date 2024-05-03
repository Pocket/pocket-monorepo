import {
  BASE_IMAGE_REFERENCE_RESOLVER,
  IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
  BASE_CACHED_IMAGE_REFERENCE_RESOLVER,
  CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
} from './sample-queries.js';
import nock, { cleanAll, pendingMocks } from 'nock';
import { getRedis, getRedisCache } from '../cache/index.js';
import { startServer } from '../server/apollo.js';
import request from 'supertest';
import { ContextManager } from '../server/context.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { expect } from '@jest/globals';

describe('queries: resolveReference', () => {
  const cache = getRedis();
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const getCacheKey = (url: string): string => {
    return getRedisCache().getKey(`image-data-${url}`);
  };
  const hasCacheValue = async (url: string) => {
    return (await cache.get(getCacheKey(url))) !== undefined;
  };
  const getCacheValue = async (url: string) => {
    return JSON.parse(await cache.get(getCacheKey(url)));
  };

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
    await cache.disconnect();
    cleanAll();
  });

  beforeEach(async () => {
    await cache.clear();
  });

  it('should return the source image url and not request image metadata', async () => {
    const testUrl = 'https://via.placeholder.com/150';

    const res = await request(app)
      .post(url)
      .send({
        query: BASE_IMAGE_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
  });

  it('should request the source image metadata only once and cache result', async () => {
    nock('https://endpoint.com')
      .get('/meta/https%3A%2F%2Fvia.placeholder.com%2F250')
      .reply(200, {
        thumbor: {
          source: {
            url: 'https://via.placeholder.com/150',
            width: 250,
            height: 250,
            frameCount: 1,
          },
          operations: [],
          target: {
            width: 250,
            height: 250,
          },
        },
      });

    const testUrl = 'https://via.placeholder.com/250';
    let res = await request(app)
      .post(url)
      .send({
        query: IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
    expect(res.body.data?._entities[0].width).toBe(250);
    expect(res.body.data?._entities[0].height).toBe(250);
    expect(pendingMocks().length).toBe(0);
    expect(await hasCacheValue(testUrl)).toBe(true);
    expect(await getCacheValue(testUrl)).toEqual({
      url: testUrl,
      width: 250,
      height: 250,
    });

    //try again and make sure it returns the cached result. Nock will error if it makes another request
    res = await request(app)
      .post(url)
      .send({
        query: IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
    expect(res.body.data?._entities[0].width).toBe(250);
    expect(res.body.data?._entities[0].height).toBe(250);
  });

  it('should return the cached image url and not request metadata', async () => {
    const testUrl = 'https://via.placeholder.com/250';
    const res = await request(app)
      .post(url)
      .send({
        query: BASE_CACHED_IMAGE_REFERENCE_RESOLVER,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
    expect(res.body.data?._entities[0].cachedImages[0].url).toBe(
      'https://endpoint.com/1800x300/filters:format(WEBP):quality(100):no_upscale():strip_exif()/https%3A%2F%2Fvia.placeholder.com%2F250',
    );
  });

  it('should return cached image url and request image metadata only once and cache result', async () => {
    const imagePath =
      '1800x300/filters:format(WEBP):quality(100):no_upscale():strip_exif()/https%3A%2F%2Fvia.placeholder.com%2F250';
    nock('https://endpoint.com')
      .get(
        '/meta/https%3A%2F%2Fendpoint.com%2F1800x300%2Ffilters%3Aformat(WEBP)%3Aquality(100)%3Ano_upscale()%3Astrip_exif()%2Fhttps%253A%252F%252Fvia.placeholder.com%252F250',
      )
      .reply(200, {
        thumbor: {
          source: {
            url: 'https://via.placeholder.com/150',
            width: 1280,
            height: 909,
            frameCount: 1,
          },
          operations: [],
          target: {
            width: 250,
            height: 250,
          },
        },
      });

    const testUrl = 'https://via.placeholder.com/250';
    let res = await request(app)
      .post(url)
      .send({
        query: CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    const cachedImageUrl = `https://endpoint.com/${imagePath}`;

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
    expect(pendingMocks().length).toBe(0);
    expect(await hasCacheValue(cachedImageUrl)).toBe(true);
    expect(await getCacheValue(cachedImageUrl)).toEqual({
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });
    expect(res.body.data?._entities[0].cachedImages[0]).toEqual({
      id: 'requested-image-1',
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });

    //try again and make sure it returns the cached result. Nock will error if it makes another request
    res = await request(app)
      .post(url)
      .send({
        query: CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
        variables: {
          representations: [
            {
              __typename: 'Image',
              url: testUrl,
            },
          ],
        },
      });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data?._entities).toHaveLength(1);
    expect(res.body.data?._entities[0].url).toBe(testUrl);
    expect(res.body.data?._entities[0].cachedImages[0]).toEqual({
      id: 'requested-image-1',
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });
  });
});
