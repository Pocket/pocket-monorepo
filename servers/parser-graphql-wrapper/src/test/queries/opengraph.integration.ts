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
import * as ogs from 'open-graph-scraper';
import { mockUnleash } from '@pocket-tools/feature-flags-client';
import * as unleash from '../../unleash';
import config from '../../config';
import { nockResponseForParser } from '../utils/parserResponse';
import { Kysely } from 'kysely';
import { DB } from '../../__generated__/readitlab';
import { conn as readitlabInit } from '../../databases/readitlab';
import { conn as sharesInit } from '../../databases/readitlaShares';
import { clearDynamoDB, dynamoClient } from '../../datasources/dynamoClient';
import { ItemSummaryDataStoreBase } from '../../databases/pocketMetadataStore';
import md5 from 'md5';
import { PocketMetadataSource } from '../../__generated__/resolvers-types';

jest.mock('open-graph-scraper');

describe('preview', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlabDB: Kysely<DB>;
  const { unleash: mockClient, repo } = mockUnleash([]);

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
  `;

  const testUrl = 'https://test.com';

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
    domain: { logo: null, name: 'test.com' },
    datePublished: '2022-06-29T20:14:49.000Z',
    url: testUrl,
    item: {
      id: 'encodedId_202cb962ac59075b964b07152d234b70',
    },
  };

  const openGraphFeatureToggle = {
    name: config.unleash.flags.openGraphParser.name,
    stale: false,
    type: 'release',
    project: 'default',
    variants: [],
    strategies: [],
    impressionData: false,
  };

  beforeAll(async () => {
    jest.spyOn(unleash, 'unleash').mockReturnValue(mockClient);
    ({ app, server, url: graphQLUrl } = await startServer(0));
    readitlabDB = readitlabInit();
    await readitlabDB.deleteFrom('items_resolver').execute();

    //Create a seed item
    await readitlabDB.insertInto('items_resolver').values([item]).execute();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(unleash, 'unleash').mockReturnValue(mockClient);
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
      openGraphData: { error: false, result: { ogTitle: 'openGraphTitle' } },
      expected: {
        title: 'openGraphTitle',
        source: PocketMetadataSource.Opengraph,
      },
    },
    {
      parserData: {},
      openGraphData: undefined,
      expected: {
        title: 'parser test',
        source: PocketMetadataSource.PocketParser,
      },
    },
  ])(
    'should return opengraph display data if enabled',
    async ({ parserData, openGraphData, expected }) => {
      if (openGraphData === undefined) {
        repo.setToggle(config.unleash.flags.openGraphParser.name, {
          ...openGraphFeatureToggle,
          enabled: false,
        });
      } else {
        repo.setToggle(config.unleash.flags.openGraphParser.name, {
          ...openGraphFeatureToggle,
          enabled: true,
        });
        jest.spyOn(ogs, 'default').mockImplementation(() => {
          return Promise.resolve({
            html: undefined,
            response: undefined,
            error: false,
            result: {},
            // override the default
            ...openGraphData,
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
    repo.setToggle(config.unleash.flags.openGraphParser.name, {
      ...openGraphFeatureToggle,
      enabled: true,
    });
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
        url: testUrl,
        urlHash: md5(testUrl),
        datePublished: null,
        title: 'the saved data',
        source: PocketMetadataSource.Opengraph,
        createdAt: Math.round(Date.now() / 1000),
        version: 1,
        __typename: 'ItemSummary',
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
          source: PocketMetadataSource.Opengraph,
          id: 'id',
          title: 'the saved data',
          datePublished: null,
          domain: null,
        },
      },
    });
  });
});
