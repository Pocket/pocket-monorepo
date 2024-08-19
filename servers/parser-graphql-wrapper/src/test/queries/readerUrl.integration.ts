import { ApolloServer } from '@apollo/server';
import { IContext } from '../../apollo/context';
import { startServer } from '../../apollo/server';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { nockResponseForParser } from '../utils/parserResponse';
import { restore, cleanAll } from 'nock';
import { getRedis } from '../../cache';
import { ParserResponse } from '../../datasources/ParserAPITypes';
import { Kysely } from 'kysely';
import { DB } from '../../__generated__/readitlab';
import { conn } from '../../databases/readitlab';

describe('referenceResolver', () => {
  const readerUrl =
    'https://getpocket.com/read/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70';
  const readerDirectUrl = 'https://someurlyoushouldsee.com';

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  let readitlabDB: Kysely<DB>;

  const parserItem: Partial<ParserResponse> = {
    given_url: readerDirectUrl,
    normal_url: readerDirectUrl,
    item_id: '123',
    resolved_id: '123',
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
    restore();
    cleanAll();
  });

  it('should return resolved item for reader url', async () => {
    const mockData = nockResponseForParser(readerDirectUrl, {
      data: parserItem,
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
          has_old_dupes: 0,
        },
      ])
      .execute();

    const itemByItemId = gql`
      query referenceResolver($url: String) {
        _entities(representations: { givenUrl: $url, __typename: "Item" }) {
          ... on Item {
            title
            itemId
            readerSlug
            givenUrl
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(itemByItemId), variables: { url: readerUrl } });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].title).toBe(mockData.data.title);
    expect(res.body.data._entities[0].givenUrl).toBe(readerDirectUrl);
    expect(res.body.data._entities[0].readerSlug).toBe(
      'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    );
    expect(res.body.data._entities[0].itemId).toBe('123');
  });

  it('should return resolved item for reader url in itemByUrl', async () => {
    const mockData = nockResponseForParser(readerDirectUrl, {
      data: parserItem,
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
          has_old_dupes: 0,
        },
      ])
      .execute();

    const itemByItemId = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
          ... on Item {
            title
            itemId
            readerSlug
            givenUrl
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(itemByItemId), variables: { url: readerUrl } });
    expect(res.body).not.toBeNull();
    expect(res.body.data.itemByUrl.title).toBe(mockData.data.title);
    expect(res.body.data.itemByUrl.givenUrl).toBe(readerDirectUrl);
    expect(res.body.data.itemByUrl.readerSlug).toBe(
      'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    );
    expect(res.body.data.itemByUrl.itemId).toBe('123');
  });
});
