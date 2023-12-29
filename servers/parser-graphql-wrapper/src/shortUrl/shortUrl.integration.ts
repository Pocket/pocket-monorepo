import { ApolloServer } from '@apollo/server';
import { IContext } from '../context';
import { startServer } from '../server';
import { getElasticacheRedis } from '../cache';
import nock from 'nock';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import {
  SharedUrlsResolverRepository,
  getSharedUrlsResolverRepo,
} from '../database/mysql';
import config from '../config';

describe('ShortUrl', () => {
  const testUrl = 'https://someurl.com';
  const variables = {
    url: testUrl,
  };

  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let sharedRepo: SharedUrlsResolverRepository;

  afterAll(async () => {
    await server.stop();
  });

  afterEach(async () => {
    await sharedRepo.clear();
  });

  beforeAll(async () => {
    sharedRepo = await getSharedUrlsResolverRepo();
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(async () => {
    // Flush the redis cache before each test
    getElasticacheRedis().flush();

    //first call for getItemByUrl.
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(
          testUrl,
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
  });

  it('should return shortUrl for a givenUrl for getItemByUrl', async () => {
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
    expect(res.body.data.getItemByUrl.shortUrl).toBe('https://pocket.co/xo');
  });

  it('should return shortUrl for a givenUrl for itemByUrl', async () => {
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
    expect(res.body.data.itemByUrl.shortUrl).toBe('https://pocket.co/xo');
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
    expect(res.body.data._entities[0].shortUrl).toBe('https://pocket.co/xo');
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
    expect(res.body.data._entities[0].shortUrl).toBe('https://pocket.co/xo');
  });

  it('should make a single db record for an existing given_url', async () => {
    //first call for getItemByUrl.
    nock(`http://example-parser.com`)
      .get(
        `/?url=${encodeURIComponent(
          testUrl,
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

    const db = await sharedRepo.batchGetShareUrlsById([1, 1]);
    expect(db.length).toBe(1);
  });
});
