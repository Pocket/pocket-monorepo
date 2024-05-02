import { ApolloServer } from '@apollo/server';
import { IContext } from '../../apollo/context.js';
import { startServer } from '../../apollo/server.js';
import { print } from 'graphql/index.js';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { nockResponseForParser } from '../utils/parserResponse.js';
import { getRedis } from '../../cache/index.js';
import { ParserResponse } from '../../datasources/ParserAPITypes.js';
import { Kysely } from 'kysely';
import { DB } from '../../__generated__/readitlab.js';
import { conn } from '../../databases/readitlab.js';

describe('referenceResolver', () => {
  const testUrl = 'https://someurl.com';
  const testUrl2 = 'https://someurlyoushouldsee.com';

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlabDB: Kysely<DB>;

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
    readitlabDB = conn();

    // flush the redis cache
    getRedis().clear();
  });

  beforeEach(async () => {
    //Delete the items
    await readitlabDB.deleteFrom('items_resolver').execute();
    await getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    await readitlabDB.destroy();
  });

  it('should return item for a single item id', async () => {
    const mockData = nockResponseForParser(testUrl, { data: parserItem });
    //Create a seed item
    await readitlabDB
      .insertInto('items_resolver')
      .values([
        {
          item_id: parseInt(mockData.data.item_id),
          search_hash: '123455sdf',
          normal_url: mockData.data.given_url,
          resolved_id: parseInt(mockData.data.item_id),
          has_old_dupes: 0,
        },
      ])
      .execute();

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
    await readitlabDB
      .insertInto('items_resolver')
      .values([
        {
          item_id: parseInt(mockData.data.item_id),
          search_hash: '123455sdf',
          normal_url: mockData.data.given_url,
          resolved_id: parseInt(mockData.data.item_id),
          has_old_dupes: false,
        },
        {
          item_id: parseInt(mockData2.data.item_id),
          search_hash: '123455sdaf',
          normal_url: mockData2.data.given_url,
          resolved_id: parseInt(mockData2.data.item_id),
          has_old_dupes: false,
        },
      ])
      .execute();

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
