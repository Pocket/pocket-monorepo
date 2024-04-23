import { cleanAll } from 'nock';
import { getRedis } from '../../cache';
import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../../apollo/context';
import { Application } from 'express';
import { IntMask } from '@pocket-tools/int-mask';
import * as ogs from 'open-graph-scraper';
import { nockResponseForParser } from '../utils/parserResponse';
import { conn } from '../../databases/readitlab';
import { ColumnType, Kysely } from 'kysely';
import { DB, ItemsResolver } from '../../__generated__/readitlab';
import { conn as sharesInit } from '../../databases/readitlaShares';
jest.mock('open-graph-scraper');

describe('readerSlug', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlaDB: Kysely<DB>;

  const GET_READER_INTERSTITIAL = gql`
    query readerSlug($slug: ID!) {
      readerSlug(slug: $slug) {
        slug
        fallbackPage {
          ... on ReaderInterstitial {
            itemCard {
              title
              authors {
                name
              }
              datePublished
              excerpt
              domain {
                name
              }
              image {
                url
              }
              url
              item {
                givenUrl
              }
            }
          }
          ... on ItemNotFound {
            message
          }
        }
      }
    }
  `;

  const testUrl = 'https://test.com';

  const item: ItemsResolver = {
    item_id: 123 as unknown as ColumnType<number, number, number>,
    search_hash: '123455sdf',
    normal_url: testUrl,
    resolved_id: 123,
    has_old_dupes: 0,
  };

  const parserItemId = '123';

  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
    readitlaDB = conn();
    //Delete the items
    await readitlaDB.deleteFrom('items_resolver').execute();
    //Create a seed item
    await readitlaDB.insertInto('items_resolver').values([item]).execute();
  });

  beforeEach(async () => {
    cleanAll();
    jest.clearAllMocks();
    jest.spyOn(ogs, 'default').mockImplementation(() => {
      return Promise.resolve({
        error: true,
        html: undefined,
        response: undefined,
        result: {},
      });
    });

    nockResponseForParser(testUrl, {
      data: {
        item_id: parserItemId,
        given_url: testUrl,
        normal_url: testUrl,
        title: 'test',
        datePublished: null,
        domainMetadata: { name: 'test.com' },
        excerpt: null,
        authors: [],
        images: [],
        topImageUrl: null,
        videos: [],
        resolved_id: '16822',
      },
    });
    // flush the redis cache
    getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
    await readitlaDB.destroy();
    await sharesInit().destroy();
    jest.restoreAllMocks();
  });

  it('should return item card fallback data', async () => {
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(123);

    const variables = {
      slug: 'inscrutableid',
    };
    const expected = {
      readerSlug: {
        slug: 'inscrutableid',
        fallbackPage: {
          itemCard: {
            image: null,
            authors: null,
            domain: { name: 'test.com' },
            datePublished: null,
            excerpt: null,
            title: 'test',
            url: testUrl,
            item: {
              givenUrl: testUrl,
            },
          },
        },
      },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_READER_INTERSTITIAL), variables });
    expect(res.body.data).toEqual(expected);
  });
  it('should return ItemNotFound if ID is not in the database', async () => {
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(11112342323);
    const variables = {
      slug: 'inscrutableid',
    };
    const expected = {
      readerSlug: {
        slug: 'inscrutableid',
        fallbackPage: {
          message: "We couldn't find that page.",
        },
      },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_READER_INTERSTITIAL), variables });
    expect(res.body.data).toEqual(expected);
  });
});
