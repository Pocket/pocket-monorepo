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
import { nockResponseForParser } from '../utils/parserResponse';
import { Kysely } from 'kysely';
import { DB } from '../../__generated__/readitlab';
import { conn as readitlabInit } from '../../databases/readitlab';
import { conn as sharesInit } from '../../databases/readitlaShares';
import { clearDynamoDB, dynamoClient } from '../../datasources/dynamoClient';
import { ItemSummaryDataStoreBase } from '../../databases/pocketMetadataStore';
import md5 from 'md5';
import {
  OEmbedType,
  PocketMetadataSource,
} from '../../__generated__/resolvers-types';
import * as oembed from '@extractus/oembed-extractor';

jest.mock('@extractus/oembed-extractor');

describe('oembedPreview', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlabDB: Kysely<DB>;

  const GET_PREVIEW = gql`
    query display($url: String!) {
      itemByUrl(url: $url) {
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
              name
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
          ... on OEmbed {
            htmlEmbed
            type
          }
        }
      }
    }
  `;

  const testUrl = 'https://tiktok.com';

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
    domain: { logo: null, name: 'tiktok.com' },
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
    await readitlabDB.destroy();
    await sharesInit().destroy();
    jest.restoreAllMocks();
  });

  it.each([
    {
      parserData: {},
      oembedData: {
        title: 'oembed video title',
        type: 'video',
        html: 'embed html',
      },
      expected: {
        title: 'oembed video title',
        source: PocketMetadataSource.Oembed,
        type: 'VIDEO',
        htmlEmbed: 'embed html',
      },
    },
    {
      parserData: {},
      oembedData: undefined,
      expected: {
        title: 'parser test',
        source: PocketMetadataSource.PocketParser,
      },
    },
    {
      parserData: {},
      oembedData: {
        type: 'video',
        author_name: 'an author',
        html: 'embeded html',
      },
      expected: {
        title: 'parser test',
        authors: [{ name: 'an author', id: '1' }],
        source: PocketMetadataSource.Oembed,
        type: 'VIDEO',
        htmlEmbed: 'embeded html',
      },
    },
  ])(
    'should return opengraph display data if enabled',
    async ({ parserData, oembedData, expected }) => {
      if (oembedData) {
        jest.spyOn(oembed, 'extract').mockImplementation(() => {
          return Promise.resolve({
            // override the default
            ...oembedData,
          });
        });
      }

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
        url: testUrl,
      };
      const res = await request(app)
        .post(graphQLUrl)
        .send({ query: print(GET_PREVIEW), variables });
      expect(res.body.data).toEqual({
        itemByUrl: { preview: { ...defaultExpected, ...expected } },
      });
    },
  );

  it('uses cached dynamodb data if available', async () => {
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
      },
    });

    await new ItemSummaryDataStoreBase(dynamoClient()).storePocketMetadata(
      {
        id: 'id',
        itemUrl: testUrl,
        urlHash: md5(testUrl),
        datePublished: null,
        title: 'the saved data',
        dataSource: PocketMetadataSource.Oembed,
        createdAt: Math.round(Date.now() / 1000),
        htmlEmbed: 'html embed',
        type: OEmbedType.Video,
      },
      3600,
    );

    const variables = {
      url: testUrl,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_PREVIEW), variables });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toEqual({
      itemByUrl: {
        preview: {
          ...defaultExpected,
          htmlEmbed: 'html embed',
          type: OEmbedType.Video,
          source: PocketMetadataSource.Oembed,
          id: 'id',
          title: 'the saved data',
          datePublished: null,
          domain: null,
        },
      },
    });
  });
});
