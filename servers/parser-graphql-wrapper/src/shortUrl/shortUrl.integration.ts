import { ApolloServer } from '@apollo/server';
import { IContext } from '../context';
import { startServer } from '../server';
import { getRedis } from '../cache';
import nock from 'nock';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import {
  ItemResolverRepository,
  SharedUrlsResolverRepository,
  getConnection,
  getItemResolverRepository,
  getSharedUrlsConnection,
  getSharedUrlsResolverRepo,
} from '../database/mysql';
import config from '../config';
import { Application } from 'express';
import { shareUrl } from './shortUrl';

describe('ShortUrl', () => {
  const testUrl = 'https://someurl.com';
  const variables = {
    url: testUrl,
  };

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let sharedRepo: SharedUrlsResolverRepository;
  let itemRepo: ItemResolverRepository;

  afterAll(async () => {
    await server.stop();
    await (await getConnection()).destroy();
    await (await getSharedUrlsConnection()).destroy();
    await getRedis().disconnect();
  });
  afterEach(() => jest.clearAllMocks());

  beforeAll(async () => {
    sharedRepo = await getSharedUrlsResolverRepo();
    itemRepo = await getItemResolverRepository();
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(async () => {
    // Flush the redis cache before each test
    await getRedis().clear();
    await itemRepo.clear();
    await sharedRepo.clear();
    await sharedRepo.query('ALTER TABLE share_urls AUTO_INCREMENT = 1');
    //first call for getItemByUrl.
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
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

  it('should return shortUrl for a givenUrl (that is not a shortUrl) for getItemByUrl', async () => {
    const GET_ITEM_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          shortUrl
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEM_BY_URL), variables });
    expect(res).not.toBeNull();
    expect(res.body.data.getItemByUrl.shortUrl).toBe('https://local.co/ab');
  });

  it('should return shortUrl for a givenUrl (that is not a shortUrl) for itemByUrl', async () => {
    const item_by_url = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
          shortUrl
        }
      }
    `;
    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(item_by_url), variables });
    expect(res).not.toBeNull();
    expect(res.body.data.itemByUrl.shortUrl).toBe('https://local.co/ab');
  });

  it('should fetch shortUrl for a CorpusItem ', async () => {
    const corpus_item_query_ = gql`
      query CorpusItem {
        _entities(
          representations: {
            url: "https://someurl.com"
            __typename: "CorpusItem"
          }
        ) {
          ... on CorpusItem {
            url
            shortUrl
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(corpus_item_query_) });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].shortUrl).toBe('https://local.co/ab');
  });
  it('should fetch shortUrl for Collection ', async () => {
    const testSlug = `test-slug`;
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(
          `${config.shortUrl.collectionUrl}/${testSlug}`,
        )}&getItem=1&output=regular`,
      )
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });

    const collections_query = gql`
        query Collection {
            _entities(representations: { slug: "${testSlug}", __typename: "Collection" }) {
                ... on Collection {
                    slug
                    shortUrl
                }
            }
        }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(collections_query) });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].shortUrl).toBe('https://local.co/ab');
  });

  it('should make a single db record for an existing given_url', async () => {
    //first call for getItemByUrl.
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
      .reply(200, {
        item: {
          given_url: testUrl,
          normal_url: testUrl,
          item_id: '1',
          resolved_id: '1',
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: [],
          images: [],
          videos: [],
        },
      });

    const item_by_url = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
          shortUrl
        }
      }
    `;
    const res1 = await request(app)
      .post(graphQLUrl)
      .send({ query: print(item_by_url), variables });

    const res2 = await request(app)
      .post(graphQLUrl)
      .send({ query: print(item_by_url), variables });

    expect(res1.body.data.itemByUrl.shortUrl).toBe(
      res2.body.data.itemByUrl.shortUrl,
    );

    const db = await sharedRepo.batchGetShareUrlsById([1]);
    expect(db.length).toBe(1);
  });
  it('fetches all shortUrls in a single batch when resolving item entities', async () => {
    const givenUrls = [testUrl, 'http://another-test.com'];
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(givenUrls[0])}&getItem=1&output=regular`)
      .reply(200, {
        item: {
          given_url: testUrl,
          item_id: '1',
          resolved_id: '1',
        },
      });
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(givenUrls[1])}&getItem=1&output=regular`)
      .reply(200, {
        item: {
          given_url: givenUrls[1],
          item_id: '2',
          resolved_id: '2',
        },
      });
    const shareBatchSpy = jest.spyOn(shareUrl, 'batchGetOrCreateShareUrls');
    const resolveItemQuery = gql`
        query Items {
            _entities(representations: [
              { givenUrl: "${givenUrls[0]}", __typename: "Item" },
              { givenUrl: "${givenUrls[1]}", __typename: "Item"}
            ]) {
                ... on Item {
                    shortUrl
                }
            }
        }
    `;
    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(resolveItemQuery) });
    const expected = [
      { shortUrl: 'https://local.co/ab' },
      { shortUrl: 'https://local.co/bc' },
    ]; // shareIds = 1,2
    expect(res.body.data._entities).toEqual(expected);
    expect(shareBatchSpy).toHaveBeenCalledTimes(1);
    expect(shareBatchSpy.mock.calls[0][0]).toEqual([
      { itemId: 1, resolvedId: 1, givenUrl: 'https://someurl.com' },
      { itemId: 2, resolvedId: 2, givenUrl: 'http://another-test.com' },
    ]);
  });

  describe('resolving from short url', () => {
    beforeEach(async () => {
      // Seed some data not needed by the other tests
      await sharedRepo.insert({
        shareUrlId: 1,
        itemId: 12345,
        resolvedId: 12345,
        givenUrl: testUrl,
      });
    });
    it('should resolve the item from the short url', async () => {
      nock(`http://example-parser.com`)
        .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
        .reply(200, {
          item: {
            given_url: testUrl,
            normal_url: testUrl,
            item_id: '12345',
            resolved_id: '12345',
            domain_metadata: {
              name: 'domain',
              logo: 'logo',
            },
            authors: [],
            images: [],
            videos: [],
          },
        });
      const url = 'https://local.co/ab';

      const item_by_url = gql`
        query itemByUrl($url: String!) {
          itemByUrl(url: $url) {
            shortUrl
            normalUrl
          }
        }
      `;
      const res = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(item_by_url),
          variables: { url },
        });
      expect(res).not.toBeNull();
      const expected = {
        itemByUrl: {
          shortUrl: url,
          normalUrl: testUrl,
        },
      };
      expect(res.body.data).toEqual(expected);
      expect(res.body.errors).toBeUndefined();
    });
    it('errors if the short url is invalid/does not exist', async () => {
      const url = 'https://local.co/bbaaaaa';
      const item_by_url = gql`
        query itemByUrl($url: String!) {
          itemByUrl(url: $url) {
            shortUrl
            normalUrl
          }
        }
      `;
      const res = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(item_by_url),
          variables: { url },
        });
      expect(res).not.toBeNull();
      const expected = {
        itemByUrl: null,
      };
      expect(res.body.data).toEqual(expected);
      // TODO: @kschelonka - make this NOT_FOUND for clients
      // and add more specific assertions
      expect(res.body.errors).not.toBeUndefined();
    });
  });
});
