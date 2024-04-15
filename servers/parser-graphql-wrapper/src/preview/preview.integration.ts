import nock, { cleanAll } from 'nock';
import { getRedis } from '../cache';
import { startServer } from '../server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../context';
import { Application } from 'express';
import { DataSource } from 'typeorm';
import { getConnection, getSharedUrlsConnection } from '../database/mysql';
import { ItemResolver } from '../entities/ItemResolver';
import { IntMask } from '@pocket-tools/int-mask';
import * as ogs from 'open-graph-scraper';

jest.mock('open-graph-scraper');

describe('preview', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let connection: DataSource;

  const GET_PREVIEW = gql`
    query display($url: String!) {
      itemByUrl(url: $url) {
        preview {
          title
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
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(123);

    // flush the redis cache
    getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
    await connection.destroy();
    await (await getSharedUrlsConnection()).destroy();
    jest.restoreAllMocks();
  });

  it.each([
    {
      parserData: {},
      openGraphData: { error: false, result: { ogTitle: 'openGraphTitle' } },
      expected: { title: 'openGraphTitle' },
    },
  ])(
    'should return item display data',
    async ({ parserData, openGraphData, expected }) => {
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
            title: 'parser test',
            authors: [],
            images: [],
            videos: [],
            resolved_id: '16822',
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
      expect(res.body.data).toEqual({ itemByUrl: { preview: expected } });
    },
  );
});
