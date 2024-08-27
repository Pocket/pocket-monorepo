import { cleanAll, restore } from 'nock';
import { getRedis } from '../../cache';
import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../../apollo/context';
import { Application } from 'express';
import { IntMask } from '@pocket-tools/int-mask';
import { nockResponseForParser } from '../utils/parserResponse';
import { Kysely } from 'kysely';
import { DB } from '../../__generated__/readitlab';
import { conn as readitlabInit } from '../../databases/readitlab';
import { conn as sharesInit } from '../../databases/readitlaShares';
import { clearDynamoDB, dynamoClient } from '../../datasources/dynamoClient';
import { PocketMetadataSource } from '../../__generated__/resolvers-types';

//TODO: Sync with @kschelonka on how we can test this best. For now I manually tested locally and in dev.
describe.skip('preview', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlabDB: Kysely<DB>;

  const GET_PREVIEW = gql`
    query display($representations: [_Any!]!) {
      _entities(representations: $representations) {
        ... on Item {
          preview {
            ... on PocketMetadata {
              source
              id
              title
              image {
                url
                src
              }
              excerpt
              authors {
                id
              }
              domain {
                name
                logo
              }
              datePublished
              url
              item {
                id
              }
            }
          }
        }
      }
    }
  `;

  const testUrl = 'https://getpocket.com/collections/testing';

  const item = {
    item_id: 123,
    search_hash: '123455sdf',
    normal_url: testUrl,
    resolved_id: 123,
    has_old_dupes: 0,
  };

  const parserItemId = '123';

  const defaultExpected = {
    id: 'encodedId_202cb962ac59075b964b07152d234b70',
    image: null,
    excerpt: null,
    authors: null,
    domain: { logo: null, name: 'getpocket.com' },
    datePublished: '2022-06-29T20:14:49.000Z',
    url: testUrl,
    item: {
      id: 'encodedId_202cb962ac59075b964b07152d234b70',
    },
  };

  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
    readitlabDB = readitlabInit();
    await readitlabDB.deleteFrom('items_resolver').execute();

    //Create a seed item
    await readitlabDB.insertInto('items_resolver').values([item]).execute();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(123);
    jest.spyOn(IntMask, 'encode').mockReturnValueOnce('encodedId');
    // flush the redis cache
    await getRedis().clear();
    await clearDynamoDB(dynamoClient());
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
    restore();
    await readitlabDB.destroy();
    await sharesInit().destroy();
    jest.restoreAllMocks();
  });

  it.each([
    {
      parserData: {},
      collection: {
        __typename: 'Collection',
        title: 'Super cool collection',
        excerpt: 'The collection',
        publishedAt: '2028-01-01',
        authors: [{ name: 'Billy Joel' }],
        imageUrl: 'https://thecoolimage.com',
      },
      syndicatedArticle: undefined,
      corpusItem: undefined,
      expected: {
        title: 'Super cool collection',
        source: PocketMetadataSource.Collection,
      },
    },
  ])(
    'should return opengraph display data if enabled',
    async ({
      parserData,
      collection,
      syndicatedArticle,
      corpusItem,
      expected,
    }) => {
      nockResponseForParser(testUrl, {
        data: {
          item_id: parserItemId,
          given_url: testUrl,
          normal_url: testUrl,
          title: 'parser test',
          authors: [],
          images: [],
          videos: [],
          resolved_id: '16822',
          excerpt: null,
          domainMetadata: null,
          topImageUrl: null,
          // override the default
          ...parserData,
        },
      });
      const variables = {
        representations: [
          { __typename: 'Item', collection, syndicatedArticle, corpusItem },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .send({ query: print(GET_PREVIEW), variables });
      expect(res.body.data).toEqual({
        itemByUrl: { preview: { ...defaultExpected, ...expected } },
      });
    },
  );
});
