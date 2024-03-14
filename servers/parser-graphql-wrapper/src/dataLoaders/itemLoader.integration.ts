import { getConnection } from '../database/mysql';
import { ItemResolver } from '../entities/ItemResolver';
import { Connection } from 'typeorm';
import * as itemLoader from './itemLoader';
import { getRedis } from '../cache';
import nock, { cleanAll } from 'nock';
import config from '../config';

const urlToParse = 'https://test.com';

const item = {
  itemId: 1234,
  searchHash: '123455sdf',
  normalUrl: urlToParse,
  resolvedId: 1234,
  hasOldDupes: false,
};

const item2 = {
  itemId: 123,
  searchHash: '123455sdf',
  normalUrl: urlToParse,
  resolvedId: 123,
  hasOldDupes: false,
};

const parserItemId = '123';

describe('itemLoader - integration', () => {
  let connection: Connection;

  beforeEach(async () => {
    //Setup our db connection
    connection = await getConnection();
    //Delete the items
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    }

    nock('http://example-parser.com')
      .get('/')
      .query({ url: urlToParse, getItem: '1', output: 'regular' })
      .reply(200, {
        item: {
          item_id: parserItemId,
          given_url: urlToParse,
          normal_url: urlToParse,
          authors: [],
          images: [],
          videos: [],
          resolved_id: '16822',
        },
      });

    // flush the redis cache
    getRedis().clear();

    //Create a seed item
    const insert = connection.manager.create(ItemResolver, item);
    const insert2 = connection.manager.create(ItemResolver, item2);
    await connection.manager.save([insert, insert2]);
  });

  afterAll(async () => {
    await getRedis().disconnect();
    await connection.close();
  });

  it('should batch resolve item ids with the given id even if the parser returns a different item id', async () => {
    const batchItems = await itemLoader.batchGetItemsByIds([parserItemId]);
    expect(batchItems[0].itemId).toEqual(parserItemId);
  });

  it('should batch resolve item ids from the parser', async () => {
    const batchItems = await itemLoader.batchGetItemsByIds([item.itemId]);
    expect(batchItems[0].itemId).toEqual(item.itemId);
  });

  it('should batch resolve item urls', async () => {
    const batchItems = await itemLoader.batchGetItemsByUrls([item.normalUrl]);
    expect(batchItems[0].givenUrl).toEqual(item.normalUrl);
  });

  it('should batch resolve item urls when error', async () => {
    config.redis.port = '123123';
    const batchItems = await itemLoader.batchGetItemsByUrls([item.normalUrl]);
    expect(batchItems[0].givenUrl).toEqual(item.normalUrl);
  });

  it('should resolve item urls with space', async () => {
    const returnedItem = await itemLoader.getItemByUrl(
      `    ${item.normalUrl}    `,
    );
    expect(returnedItem.givenUrl).toEqual(item.normalUrl);
  });

  it('should retry up to 3 times', async () => {
    cleanAll();

    nock('http://example-parser.com')
      .get('/')
      .query({ url: urlToParse, getItem: '1', output: 'regular' })
      .reply(503, {})
      .get('/')
      .query({ url: urlToParse, getItem: '1', output: 'regular' })
      .reply(200, {})
      .get('/')
      .query({ url: urlToParse, getItem: '1', output: 'regular' })
      .reply(200, {
        item: {
          item_id: parserItemId,
          given_url: urlToParse,
          normal_url: urlToParse,
          authors: [],
          images: [],
          videos: [],
          resolved_id: '16822',
        },
      });

    const returnedItem = await itemLoader.getItemByUrl(
      `    ${item.normalUrl}    `,
    );
    expect(returnedItem.givenUrl).toEqual(item.normalUrl);
    expect(returnedItem.id).toEqual('16822');
  });

  it('should retry with a refresh when resolved_id is 0', async () => {
    cleanAll();

    const scope = nock('http://example-parser.com')
      .get('/')
      .query({ url: urlToParse, getItem: '1', output: 'regular' })
      .reply(200, {
        item: {
          item_id: parserItemId,
          given_url: urlToParse,
          normal_url: urlToParse,
          authors: null,
          images: null,
          videos: null,
          resolved_id: '0',
        },
      })
      .get('/')
      .query({
        url: urlToParse,
        getItem: '1',
        output: 'regular',
        refresh: true,
      })
      .reply(200, {
        item: {
          item_id: parserItemId,
          given_url: urlToParse,
          normal_url: urlToParse,
          authors: [],
          images: [],
          videos: [],
          resolved_id: '123',
        },
      });

    const returnedItem = await itemLoader.getItemByUrl(
      `    ${item.normalUrl}    `,
    );
    expect(scope.isDone()).toBeTruthy();
    expect(returnedItem.givenUrl).toEqual(item.normalUrl);
    expect(returnedItem.resolvedId).toEqual('123');
    expect(returnedItem.id).toEqual(
      'fo562fkc52f1ee092fOXe3Z2a7907eb576688dccd6e6a7fh4754a0d22d',
    );
  });
});
