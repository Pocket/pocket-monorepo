import { getConnection } from '../datasources/mysql';
import { ItemResolver } from '../entities/ItemResolver';
import { DataSource } from 'typeorm';
import * as itemLoader from './itemLoader';
import { getRedis } from '../cache';

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

describe('itemLoader - integration', () => {
  let connection: DataSource;

  beforeEach(async () => {
    //Setup our db connection
    connection = await getConnection();
    //Delete the items
    await connection.query('TRUNCATE readitla_b.items_resolver');

    // flush the redis cache
    getRedis().clear();

    //Create a seed item
    const insert = connection.manager.create(ItemResolver, item);
    const insert2 = connection.manager.create(ItemResolver, item2);
    await connection.manager.save([insert, insert2]);
  });

  afterAll(async () => {
    await getRedis().disconnect();
    await connection.destroy();
  });

  it('should batch resolve item ids from the parser', async () => {
    const batchItems = await itemLoader.batchGetItemsByIds([
      item.itemId.toString(),
    ]);
    expect(batchItems[0].itemId).toEqual(item.itemId.toString());
    expect(batchItems[0].url).toEqual(urlToParse);
  });
});
