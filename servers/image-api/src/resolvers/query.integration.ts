import { getTestServer } from '../test/server';
import { expect } from 'chai';
import {
  BASE_IMAGE_REFERENCE_RESOLVER,
  IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
  BASE_CACHED_IMAGE_REFERENCE_RESOLVER,
  CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
} from './sample-queries';
import nock from 'nock';
import { getRedisCache } from '../cache';

describe('queries: resolveReference', () => {
  const server = getTestServer();
  const cache = getRedisCache();

  const getCacheKey = (url: string): string => {
    return cache.getKey(`image-data-${url}`);
  };
  const hasCacheValue = async (url: string) => {
    return (await cache.get(getCacheKey(url))) !== undefined;
  };
  const getCacheValue = async (url: string) => {
    return JSON.parse(await cache.get(getCacheKey(url)));
  };

  beforeAll(async () => {
    nock.disableNetConnect(); //disable real network requests
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    await cache.clear();
  });

  it('should return the source image url and not request image metadata', async () => {
    const url = 'https://via.placeholder.com/150';
    const result = await server.executeOperation({
      query: BASE_IMAGE_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
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

    const url = 'https://via.placeholder.com/250';
    let result = await server.executeOperation({
      query: IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
    expect(result.data?._entities[0].width).to.equal(250);
    expect(result.data?._entities[0].height).to.equal(250);
    expect(nock.pendingMocks.length).to.equal(0);
    expect(await hasCacheValue(url)).to.be.true;
    expect(await getCacheValue(url)).to.deep.equal({
      url: url,
      width: 250,
      height: 250,
    });

    //try again and make sure it returns the cached result. Nock will error if it makes another request
    result = await server.executeOperation({
      query: IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
    expect(result.data?._entities[0].width).to.equal(250);
    expect(result.data?._entities[0].height).to.equal(250);
  });

  it('should return the cached image url and not request metadata', async () => {
    const url = 'https://via.placeholder.com/250';
    const result = await server.executeOperation({
      query: BASE_CACHED_IMAGE_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
    expect(result.data?._entities[0].cachedImages[0].url).to.equal(
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

    const url = 'https://via.placeholder.com/250';
    let result = await server.executeOperation({
      query: CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    const cachedImageUrl = `https://endpoint.com/${imagePath}`;

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
    expect(nock.pendingMocks.length).to.equal(0);
    expect(await hasCacheValue(cachedImageUrl)).to.be.true;
    expect(await getCacheValue(cachedImageUrl)).to.deep.equal({
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });
    expect(result.data?._entities[0].cachedImages[0]).to.deep.equal({
      id: 'requested-image-1',
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });

    //try again and make sure it returns the cached result. Nock will error if it makes another request
    result = await server.executeOperation({
      query: CACHED_IMAGE_REFERENCE_RESOLVER_METADATA,
      variables: {
        representations: [
          {
            __typename: 'Image',
            url: url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].url).to.equal(url);
    expect(result.data?._entities[0].cachedImages[0]).to.deep.equal({
      id: 'requested-image-1',
      url: cachedImageUrl,
      width: 1280,
      height: 909,
    });
  });
});
