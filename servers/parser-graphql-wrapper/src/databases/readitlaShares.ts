import config from '../config/index.js';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { DB, ShareUrls } from '../__generated__/readitlaShares.js';

let connection: Kysely<DB>;

export type BatchAddShareUrlInput = {
  itemId: number;
  resolvedId: number;
  givenUrl: string;
};

/**
 * Kysely query builder for more control
 * @returns Kysely query builder
 */
export function conn(): Kysely<DB> {
  if (connection) return connection;
  const dialect = new MysqlDialect({
    pool: createPool({
      database: 'readitla_shares',
      host: config.pocketSharedRds.host,
      user: config.pocketSharedRds.username,
      password: config.pocketSharedRds.password,
      port: config.pocketSharedRds.port,
      connectionLimit: 10,
      timezone: '+00:00',
    }),
  });
  connection = new Kysely<DB>({
    dialect,
  });
  return connection;
}

export const addToShareUrls = async (
  db: Kysely<DB>,
  itemId: number,
  resolvedId: number,
  givenUrl: string,
): Promise<bigint> => {
  const insertResult = await db
    .insertInto('share_urls')
    .values([
      {
        userId: config.shortUrl.userId,
        itemId: itemId,
        resolvedId: resolvedId,
        givenUrl: givenUrl,
        apiId: config.shortUrl.apiId,
        serviceId: config.shortUrl.serviceId,
        timeGenerated: new Date().getTime() / 1000,
        timeShared: new Date().getTime() / 1000,
      },
    ])
    .executeTakeFirst();

  return insertResult.insertId;
};

export const batchAddToShareUrls = async (
  db: Kysely<DB>,
  input: BatchAddShareUrlInput[],
): Promise<bigint[]> => {
  const inserts: Omit<ShareUrls, 'share_url_id'>[] = input.map(
    ({ itemId, resolvedId, givenUrl }) => ({
      user_id: config.shortUrl.userId,
      item_id: itemId,
      resolved_id: resolvedId,
      given_url: givenUrl,
      api_id: config.shortUrl.apiId,
      service_id: config.shortUrl.serviceId,
      time_generated: new Date().getTime() / 1000,
      time_shared: new Date().getTime() / 1000,
    }),
  );

  const insertResult = await db
    .insertInto('share_urls')
    .values(inserts)
    .execute();
  return insertResult.map((row) => row.insertId);
};

export const getShareUrls = async (db: Kysely<DB>, itemId: number) => {
  return await db
    .selectFrom('share_urls')
    .selectAll()
    .where('item_id', '=', itemId)
    .executeTakeFirstOrThrow();
};

export const batchGetShareUrlsById = async (
  db: Kysely<DB>,
  itemIds: number[],
) => {
  return await db
    .selectFrom('share_urls')
    .selectAll()
    .where('item_id', 'in', itemIds)
    .execute();
};

export const fetchByShareId = async (db: Kysely<DB>, id: number) => {
  return await db
    .selectFrom('share_urls')
    .selectAll()
    .where('share_url_id', '=', id)
    .executeTakeFirstOrThrow();
};
