import { ApolloServer } from '@apollo/server';
import { IContext } from '../../apollo/context';
import { startServer } from '../../apollo/server';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { nockResponseForParser } from '../utils/parserResponse';
import { getRedis } from '../../cache';
import { ParserResponse } from '../../datasources/ParserAPITypes';
import { DataSource } from 'typeorm';
import { getConnection } from '../../datasources/mysql';
import { ItemResolver } from '../../entities/ItemResolver';

describe('referenceResolver', () => {
  const testUrl = 'https://someurl.com';
  const testUrl2 = 'https://someurlyoushouldsee.com';

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let connection: DataSource;

  const parserItem: Partial<ParserResponse> = {
    given_url: testUrl,
    normal_url: testUrl,
    item_id: '1',
    resolved_id: '1',
    domainMetadata: {
      name: 'domain',
      logo: 'logo',
    },
    authors: [],
    images: [],
    videos: [],
    time_to_read: 5,
  };

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
    //Setup our db connection
    connection = await getConnection();
    //Delete the items
    await connection.query('TRUNCATE readitla_b.items_resolver');

    // flush the redis cache
    getRedis().clear();
  });

  beforeEach(async () => {
    await getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    await connection.destroy();
  });

  it('should return item for a single item id', async () => {
    const mockData = nockResponseForParser(testUrl, { data: parserItem });
    //Create a seed item
    const insert = connection.manager.create(ItemResolver, {
      itemId: parseInt(mockData.data.item_id),
      searchHash: '123455sdf',
      normalUrl: mockData.data.given_url,
      resolvedId: parseInt(mockData.data.item_id),
      hasOldDupes: false,
    });
    await connection.manager.save([insert]);

    const itemByItemId = gql`
      query referenceResolver {
        _entities(representations: { itemId: "1", __typename: "Item" }) {
          ... on Item {
            title
            givenUrl
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(itemByItemId) });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].title).toBe(mockData.data.title);
    expect(res.body.data._entities[0].givenUrl).toBe(testUrl);
  });

  it('should return item for a multiple item ids', async () => {
    const mockData = nockResponseForParser(testUrl, { data: parserItem });
    const mockData2 = nockResponseForParser(testUrl2, {
      data: { ...parserItem, item_id: '2' },
    });

    //Create a seed item
    const insert = connection.manager.create(ItemResolver, {
      itemId: parseInt(mockData.data.item_id),
      searchHash: '123455sdf',
      normalUrl: mockData.data.given_url,
      resolvedId: parseInt(mockData.data.item_id),
      hasOldDupes: false,
    });
    const insert2 = connection.manager.create(ItemResolver, {
      itemId: parseInt(mockData2.data.item_id),
      searchHash: '123455sdaf',
      normalUrl: mockData2.data.given_url,
      resolvedId: parseInt(mockData2.data.item_id),
      hasOldDupes: false,
    });
    await connection.manager.save([insert, insert2]);

    const itemByItemId = gql`
      query referenceResolver {
        _entities(
          representations: [
            { itemId: "1", __typename: "Item" }
            { itemId: "2", __typename: "Item" }
          ]
        ) {
          ... on Item {
            title
            givenUrl
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(itemByItemId) });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].title).toBe(mockData.data.title);
    expect(res.body.data._entities[0].givenUrl).toBe(mockData.data.given_url);
    expect(res.body.data._entities[1].title).toBe(mockData2.data.title);
    expect(res.body.data._entities[1].givenUrl).toBe(mockData2.data.given_url);
  });
});
