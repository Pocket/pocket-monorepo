import { DataSource, Repository } from 'typeorm';
import { ItemResolver } from '../entities/ItemResolver';
import config from '../config';
import { ShareUrls } from '../entities/ShareUrls';

let connection: DataSource;
let sharedUrlsConnection: DataSource;

/**
 * Creates a connection that we can use for typeorm
 * This should only be used below, but we export it so tests can access it
 */
export const getConnection = async (): Promise<DataSource> => {
  if (connection) {
    return connection;
  }

  connection = new DataSource({
    type: 'mysql',
    host: config.mysql.host,
    port: config.mysql.port,
    username: config.mysql.username,
    password: config.mysql.password,
    database: 'readitla_b',
    entities: [ItemResolver],
  });

  await connection.initialize();

  // But Chelsea! There's a timezone key available in the options we pass to createConnection above!
  // Correct! It does not work! https://github.com/typeorm/typeorm/issues/5895
  // So instead we do:
  await connection.manager.query("SET @@session.time_zone = 'US/Central';");

  return connection;
};

/**
 * Creates a connection that we can use for typeorm
 * This should only be used below, but we export it so tests can access it
 */
export const getSharedUrlsConnection = async (): Promise<DataSource> => {
  if (sharedUrlsConnection) {
    return sharedUrlsConnection;
  }

  sharedUrlsConnection = new DataSource({
    type: 'mysql',
    host: config.pocketSharedRds.host,
    port: config.pocketSharedRds.port,
    username: config.pocketSharedRds.username,
    password: config.pocketSharedRds.password,
    database: 'readitla_shares',
    entities: [ShareUrls],
  });

  await sharedUrlsConnection.initialize();

  return sharedUrlsConnection;
};

export type ItemResolverRepository = Repository<ItemResolver> & {
  getResolvedItemById(itemId: string): Promise<ItemResolver>;
};

/**
 * Gets the ItemResolver Repository from typeorm
 */
export const getItemResolverRepository = async () => {
  return (await getConnection()).getRepository(ItemResolver).extend({
    /**
     * Gets a resolved item resolver from a given item id.
     * This performs the equivalent to either of these queries. But does the first one for simplicity.
     * SELECT resolved_id FROM items_resolver  as i WHERE i.item_id = 173
     * @param itemId
     */
    async getResolvedItemById(itemId: string): Promise<ItemResolver> {
      //First lets make a subquery that will get the resolved id from an item id.
      const query = this.createQueryBuilder('item').where(
        'item.item_id = :itemId',
        { itemId: itemId },
      );
      return await query.getOneOrFail();
    },
  });
};

export type SharedUrlsResolverRepository = Repository<ShareUrls> & {
  addToShareUrls(
    itemId: number,
    resolvedId: number,
    givenUrl: string,
  ): Promise<number>;
  getShareUrls(itemId: number): Promise<ShareUrls>;
  batchGetShareUrlsById(itemIds: number[]): Promise<ShareUrls[]>;
};

/**
 * Gets the ItemResolver Repository from typeorm
 */
export const getSharedUrlsResolverRepo = async () => {
  return (await getSharedUrlsConnection()).getRepository(ShareUrls).extend({
    async addToShareUrls(
      itemId: number,
      resolvedId: number,
      givenUrl: string,
    ): Promise<number> {
      const obj: Omit<ShareUrls, 'shareUrlId'> = {
        userId: config.shortUrl.userId,
        itemId: itemId,
        resolvedId: resolvedId,
        givenUrl: givenUrl,
        apiId: config.shortUrl.apiId,
        serviceId: config.shortUrl.serviceId,
        timeGenerated: new Date().getTime() / 1000,
        timeShared: new Date().getTime() / 1000,
      };

      const insertResult = await this.manager
        .getRepository(ShareUrls)
        .insert(obj);
      return insertResult.identifiers[0].shareUrlId;
    },

    /**
     * gets a resolvedItem by itemId
     * @param itemId
     */
    async getShareUrls(itemId: number): Promise<ShareUrls> {
      const query = this.createQueryBuilder('sharedUrls').where(
        'sharedUrls.item_id = :itemId',
        { itemId: itemId },
      );
      return query.getOne();
    },

    async batchGetShareUrlsById(itemIds: number[]): Promise<ShareUrls[]> {
      const query = this.createQueryBuilder('sharedUrls').where(
        'sharedUrls.item_id IN (:...itemIds)',
        { itemIds: itemIds },
      );
      return query.getMany();
    },
  });
};
