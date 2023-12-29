import { expect } from 'chai';
import { ItemResolver } from './ItemResolver';
import { getConnection, getItemResolverRepository } from '../database/mysql';
import { DataSource } from 'typeorm';

const item = {
  itemId: 1234,
  searchHash: '123455sdf',
  normalUrl: 'http://thedude.abides',
  resolvedId: 1234,
  hasOldDupes: false,
};

describe('ItemResolver Resolver Repository', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    //Setup our db connection
    dataSource = await getConnection();
    //Delete the items
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    }

    //Create a seed item
    const insert = dataSource.manager.create(ItemResolver, item);
    await dataSource.manager.save([insert]);
  });

  afterAll(async () => {
    await dataSource.close();
  });

  it('gets an item by item id', async () => {
    const itemResolverRepo = getItemResolverRepository();
    const retrievedItem = await (
      await itemResolverRepo
    ).getResolvedItemById(`1234`);
    expect(retrievedItem).to.eql(item);
  });

  it('assigns time zones properly', async () => {
    // This is essentially a configuration test, which normally we would not do
    // But as we are hoping to make our app's operation independent of our database hosting (which it was not before),
    // we need to make sure that the time zones will be displayed and sent in the US/Central time zone.
    const time_zone = await dataSource.query('SELECT @@SESSION.time_zone');
    expect(time_zone).to.eql([{ '@@SESSION.time_zone': 'US/Central' }]);
  });
});
