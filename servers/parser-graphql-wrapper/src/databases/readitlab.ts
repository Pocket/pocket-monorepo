import { Kysely, MysqlDialect } from 'kysely';
import { DB } from '../__generated__/readitlab';
import { createPool } from 'mysql2';
import config from '../config';

let connection: Kysely<DB>;

/**
 * Kysely query builder for more control
 * @returns Kysely query builder
 */
export function conn(): Kysely<DB> {
  if (connection) return connection;
  const dialect = new MysqlDialect({
    pool: createPool({
      database: 'readitla_b',
      host: config.mysql.host,
      user: config.mysql.username,
      password: config.mysql.password,
      port: config.mysql.port,
      connectionLimit: 10,
      timezone: '+00:00',
    }),
  });
  connection = new Kysely<DB>({
    dialect,
  });
  return connection;
}

type ItemIdIndexedArray = Record<
  number,
  {
    item_id: number;
    normal_url: string;
    resolved_id: number;
  }
>;

/**
 *
 * @param db The keysly db for readitlab
 * @param itemIds the array of item ids
 * @returns
 */
export const resolvedItemsByItemIds = async (
  db: Kysely<DB>,
  itemIds: number[],
): Promise<
  {
    item_id: number;
    normal_url: string;
    resolved_id: number;
  }[]
> => {
  // Note: We should eventually also join against list to get a real givenUrl instead of a normal url that may not work in the parser.
  /**
   * Gets a resolved item resolver from a given item id.
   * This performs the equivalent to either of these queries. But does the first one for simplicity.
   * SELECT resolved_id FROM items_resolver  as i WHERE i.item_id = 173
   * @param itemId
   */
  const databaseResponse = await db
    .selectFrom('items_resolver')
    .select(['item_id', 'normal_url', 'resolved_id'])
    .where('item_id', 'in', itemIds)
    .execute();

  // Reduce to an array that is indexed by item_id for fast lookup
  const itemIdIndexed = databaseResponse
    // Return the results as an array indexed by item_id
    .reduce((acc, item) => {
      acc[item.item_id] = item;
      return acc;
    }, {} as ItemIdIndexedArray);

  // Fill in all the missing values with null for the resolveReference
  const itemIdIndexedWithNull = itemIds.map((itemId: number) => {
    return itemIdIndexed[itemId] ?? null;
  });

  return itemIdIndexedWithNull;
};
