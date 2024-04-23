import { conn } from '../databases/readitlab';
import * as itemLoader from './itemLoader';
import { getRedis } from '../cache';
import { Kysely } from 'kysely';
import { DB, Generated, ItemsResolver } from '../__generated__/readitlab';

const urlToParse = 'https://test.com';

const item: ItemsResolver = {
  item_id: 1234 as unknown as Generated<number>,
  search_hash: '123455sdf',
  normal_url: urlToParse,
  resolved_id: 1234,
  has_old_dupes: 0,
};

const item2: ItemsResolver = {
  item_id: 123 as unknown as Generated<number>,
  search_hash: '123455sdf',
  normal_url: urlToParse,
  resolved_id: 123,
  has_old_dupes: 0,
};

describe('itemLoader - integration', () => {
  let connection: Kysely<DB>;

  beforeEach(async () => {
    //Setup our db connection
    connection = conn();

    //Delete the items
    await connection.deleteFrom('items_resolver').execute();

    // flush the redis cache
    getRedis().clear();

    //Create a seed item
    await connection
      .insertInto('items_resolver')
      .values([item, item2])
      .execute();
  });

  afterAll(async () => {
    await getRedis().disconnect();
    await connection.destroy();
  });

  it('should batch resolve item ids from the parser', async () => {
    const batchItems = await itemLoader.batchGetItemsByIds([
      item.item_id.toString(),
    ]);
    expect(batchItems[0].itemId).toEqual(item.item_id.toString());
    expect(batchItems[0].url).toEqual(urlToParse);
  });
});
