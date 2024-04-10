import nock, { cleanAll } from 'nock';
import { getRedis } from '../cache';
import { startServer } from '../server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../context';
import { Application } from 'express';
import { Connection } from 'typeorm';
import { getConnection } from '../database/mysql';
import { ItemResolver } from '../entities/ItemResolver';
import { IntMask } from '@pocket-tools/int-mask';

describe('readerSlug', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let connection: Connection;

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

  const item = {
    itemId: 123,
    searchHash: '123455sdf',
    normalUrl: testUrl,
    resolvedId: 123,
    hasOldDupes: false,
  };

  const parserItemId = '123';

  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
    connection = await getConnection();
    //Delete the items
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    }
    //Create a seed item
    const insert = connection.manager.create(ItemResolver, item);
    await connection.manager.save([insert]);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    nock('http://example-parser.com')
      .get('/')
      .query({
        url: testUrl,
        getItem: '1',
        output: 'regular',
        enableItemUrlFallback: '1',
      })
      .reply(200, {
        item: {
          item_id: parserItemId,
          given_url: testUrl,
          normal_url: testUrl,
          title: 'test',
          authors: [],
          images: [],
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
    await connection.close();
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
