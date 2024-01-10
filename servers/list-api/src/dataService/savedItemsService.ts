import { Knex } from 'knex';
import { IContext } from '../server/context';
import { mysqlTimeString } from './utils';
import { SavedItem, SavedItemStatus, SavedItemUpsertInput } from '../types';
import config from '../config';
import { ItemResponse } from '../externalCaller/parserCaller';
import { chunk } from 'lodash';
import { RawListResult, ListResult } from './types';

export type ListEntity = {
  user_id?: number;
  item_id?: number;
  resolved_id?: number;
  given_url?: string;
  title?: string;
  time_added?: Date;
  time_updated?: Date;
  time_read?: Date;
  time_favorited?: Date;
  api_id?: number;
  status?: number;
  favorite?: boolean;
  api_id_updated?: number;
};

/***
 * class that handles the read and write from `readitla-temp.list` table
 * note: for mutations, please pass the writeClient, otherwise there will be replication lags.
 */
export class SavedItemDataService {
  private static statusMap = {
    [SavedItemStatus.UNREAD]: 'UNREAD',
    [SavedItemStatus.ARCHIVED]: 'ARCHIVED',
    [SavedItemStatus.DELETED]: 'DELETED',
    [SavedItemStatus.HIDDEN]: 'HIDDEN',
  };
  private db: Knex;
  private readonly userId: string;
  private readonly apiId: string;
  // For toggle/release flags
  private flags: Record<string, boolean>;
  constructor(
    private readonly context: Pick<
      IContext,
      'dbClient' | 'userId' | 'apiId' | 'unleash'
    >,
  ) {
    this.db = context.dbClient;
    this.userId = context.userId;
    this.apiId = context.apiId;
    this.flags = {
      mirrorWrites: this.context.unleash.isEnabled(
        config.unleash.flags.mirrorWrites.name,
        undefined,
        config.unleash.flags.mirrorWrites.fallback,
      ),
    };
  }

  public static convertDbResultStatus<T extends Pick<RawListResult, 'status'>>(
    dbResult: T,
  ): T & { status: Pick<ListResult, 'status'> };
  public static convertDbResultStatus<T extends Pick<RawListResult, 'status'>>(
    dbResult: Array<T>,
  ): Array<T & { status: Pick<ListResult, 'status'> }>;
  /**
   * Convert the `status` field in the list table to the expected
   * GraphQL ENUM string
   * @param dbResult
   */
  public static convertDbResultStatus<T extends Pick<RawListResult, 'status'>>(
    dbResult: T | T[],
  ):
    | (T & { status: Pick<ListResult, 'status'> })
    | Array<T & { status: Pick<ListResult, 'status'> }> {
    if (dbResult == null) {
      return undefined;
    }
    const statusConvert = (row: T) => {
      return {
        ...row,
        status:
          row.status != null
            ? SavedItemDataService.statusMap[row.status]
            : row.status,
      };
    };
    if (dbResult instanceof Array) {
      return dbResult.map((row) => statusConvert(row));
    }
    return statusConvert(dbResult);
  }

  /**
   * Format a date to the configured database timezone
   * @param date
   * @private
   */
  private static formatDate(date: Date): string {
    return mysqlTimeString(date, config.database.tz);
  }

  /**
   * Helper function to build repeated queries, for DRY savedItem and savedItems fetches.
   * Will eventually be extended for building filter, sorts, etc. for different pagination, etc.
   * For now just to reuse the same query and reduce testing burden :)
   */
  public buildQuery(): any {
    return this.db('list').select(
      'given_url AS url',
      'item_id AS id',
      'resolved_id AS resolvedId', // for determining if an item is pending
      'favorite as isFavorite',
      'title',
      this.db.raw(
        'CASE WHEN favorite = 1 THEN UNIX_TIMESTAMP(time_favorited) ELSE null END as favoritedAt ',
      ),
      'time_favorited', // for pagination sort
      'status',
      this.db.raw(
        `CASE WHEN status = ${SavedItemStatus.ARCHIVED} THEN true ELSE false END as isArchived`,
      ),
      this.db.raw('UNIX_TIMESTAMP(time_added) as _createdAt'),
      'time_added', // for pagination sort
      'item_id',
      this.db.raw('UNIX_TIMESTAMP(time_updated) as _updatedAt'),
      'time_updated', // for pagination sort
      this.db.raw(
        `CASE WHEN status = ${SavedItemStatus.DELETED} THEN UNIX_TIMESTAMP(time_updated) ELSE null END as _deletedAt`,
      ),
      this.db.raw(
        `CASE WHEN status = ${SavedItemStatus.ARCHIVED} THEN UNIX_TIMESTAMP(time_read) ELSE null END as archivedAt`,
      ),
    );
  }

  /**
   * Fetch a single SavedItem from a User's list
   * @param itemId the savedItem ID to fetch
   */
  public getSavedItemById(itemId: string): Promise<SavedItem | null> {
    const query = this.buildQuery()
      .where({ user_id: this.userId, item_id: itemId })
      .first();

    return query.then(SavedItemDataService.convertDbResultStatus);
  }

  /**
   * Fetch a row from the list table by user_id and item_id
   * @param itemId the item_id to fetch (if exists)
   * @param trx an open Knex transaction
   * @returns Promise<RawListResult | null>
   */
  public getSavedItemByIdRaw(
    itemId: string,
    trx: Knex.Transaction,
  ): Promise<RawListResult | null> {
    return trx('list')
      .select('*')
      .where({ user_id: this.userId, item_id: itemId })
      .first();
  }

  /**
   * Fetch a single SavedItem via its unique URL from a user's list
   * @param givenUrl the URL of the item to fetch
   */
  public getSavedItemByGivenUrl(givenUrl: string): Promise<SavedItem> {
    const query = this.buildQuery()
      .where({ user_id: this.userId, given_url: givenUrl })
      .first();

    return query.then(SavedItemDataService.convertDbResultStatus);
  }

  /**
   * Fetch all SavedItems via a list of unique ids from a user's list
   * @param itemIds the id of the items to fetch
   */
  public batchGetSavedItemsByGivenIds(itemIds: string[]): Promise<SavedItem[]> {
    const query = this.buildQuery()
      .where({ user_id: this.userId })
      .whereIn('item_id', itemIds);

    return query.then(SavedItemDataService.convertDbResultStatus);
  }

  /**
   * Fetch all SavedItems via a list of unique URLs from a user's list
   * @param urls the URLs of the items to fetch
   */
  public batchGetSavedItemsByGivenUrls(urls: string[]): Promise<SavedItem[]> {
    const query = this.buildQuery()
      .where({ user_id: this.userId })
      .whereIn('given_url', urls);

    return query.then(SavedItemDataService.convertDbResultStatus);
  }

  /**
   * Get time read for a saved item
   * @param itemId
   */
  public async getSavedItemTimeRead(itemId: string): Promise<any> {
    return this.db('list')
      .select(
        this.db.raw('SQL_NO_CACHE UNIX_TIMESTAMP(time_read) as time_read'),
      )
      .where({ item_id: itemId, user_id: this.userId })
      .first();
  }

  /**
   * Update the 'favorite' attribute of an item, and the auditing fields
   * in the table ('time_updated', etc.)
   * @param itemId the item ID to update
   * @param favorite whether the item is a favorite or not
   * @param updatedAt optional timestamp for when the mutation occured
   * (defaults to current server time)
   * @returns savedItem savedItem that got updated
   */
  public async updateSavedItemFavoriteProperty(
    itemId: string,
    favorite: boolean,
    updatedAt?: Date,
  ): Promise<SavedItem | null> {
    const timestamp = updatedAt ?? SavedItemDataService.formatDate(new Date());
    const timeFavorited = favorite ? timestamp : '0000-00-00 00:00:00';
    await this.db.transaction(async (trx) => {
      await trx('list')
        .update({
          favorite: +favorite,
          time_favorited: timeFavorited,
          time_updated: timestamp,
          api_id_updated: this.apiId,
        })
        .where({ item_id: itemId, user_id: this.userId });
      const row = await this.getSavedItemByIdRaw(itemId, trx);
      if (row != null && this.flags.mirrorWrites) {
        await SavedItemDataService.syncShadowTable(row, trx);
      }
    });
    return await this.getSavedItemById(itemId);
  }

  /**
   * Update the 'status' attribute of an item, for archive/unarchive,
   * and the auditing fields in the table ('time_updated', etc.)
   * @param itemId the item ID to update
   * @param archived whether the item is a favorite or not
   * @param updatedAt optional timestamp for when the mutation occured
   * (defaults to current server time)
   * @returns savedItem savedItem that got updated
   */
  public async updateSavedItemArchiveProperty(
    itemId: string,
    archived: boolean,
    updatedAt?: Date,
  ): Promise<SavedItem | null> {
    const timestamp = updatedAt ?? SavedItemDataService.formatDate(new Date());
    const timeArchived = archived ? timestamp : '0000-00-00 00:00:00';
    const status = archived ? 1 : 0;
    // TODO: Do we care if this makes an update that doesn't change the status?
    // e.g. archiving an already archived item will update
    //    time_read, time_upated, api_id_updated; but not status
    await this.db.transaction(async (trx) => {
      await trx('list')
        .update({
          status: status,
          time_read: timeArchived,
          time_updated: timestamp,
          api_id_updated: this.apiId,
        })
        .where({ item_id: itemId, user_id: this.userId });
      const row = await this.getSavedItemByIdRaw(itemId, trx);
      if (row != null && this.flags.mirrorWrites) {
        await SavedItemDataService.syncShadowTable(row, trx);
      }
    });
    return await this.getSavedItemById(itemId);
  }

  /**
   * Mirror writes from `list` table to `list_schema_update` table
   * as part of item_id overflow mitigation.
   * @param rows the rows to copy into the shadow table
   * @param trx the transaction object to use for the copy
   */
  public static async syncShadowTableBulk(
    rows: RawListResult[],
    trx: Knex.Transaction,
  ) {
    const input = rows.map((row) =>
      Object.keys(row).reduce((obj, key) => {
        if (row[key] instanceof Date && isNaN(row[key])) {
          // Convert "Invalid Date" into the mysql zero-date
          obj[key] = '0000-00-00 00:00:00';
        } else {
          obj[key] = row[key];
        }
        return obj;
      }, {}),
    );
    return trx('list_schema_update').insert(input).onConflict().merge();
  }
  /**
   * Mirror writes from `list` table to `list_schema_update` table
   * as part of item_id overflow mitigation.
   * @param rows the rows to copy into the shadow table
   * @param trx the transaction object to use for the copy
   */
  public static async syncShadowTable(
    row: RawListResult,
    trx: Knex.Transaction,
  ) {
    const input = Object.keys(row).reduce((obj, key) => {
      if (row[key] instanceof Date && isNaN(row[key])) {
        // Convert "Invalid Date" into the mysql zero-date
        obj[key] = '0000-00-00 00:00:00';
      } else {
        obj[key] = row[key];
      }
      return obj;
    }, {});
    return trx('list_schema_update').insert(input).onConflict().merge();
  }

  /**
   * Delete a saved item. Since we delete from multiple tables,
   * we perform the entire operation as a single transaction
   * to allow us to fully rollback should any on of the
   * database statements fail.
   * @param itemId the itemId to delete
   * @param deletedAt optional timestamp for when the mutation was completed;
   * defaults to current server time
   */
  public async deleteSavedItem(itemId, deletedAt?: Date) {
    const timestamp = deletedAt ?? SavedItemDataService.formatDate(new Date());
    const transaction = await this.db.transaction();
    try {
      // remove tags for saved item
      await transaction('item_tags').delete().where({
        user_id: this.userId,
        item_id: itemId,
      });

      // remove attribution for saved item
      await transaction('item_attribution').delete().where({
        user_id: this.userId,
        item_id: itemId,
      });

      // remove scroll position for saved item
      await transaction('items_scroll').delete().where({
        user_id: this.userId,
        item_id: itemId,
      });

      // update status for saved item to soft delete
      await transaction('list')
        .update({
          status: SavedItemStatus.DELETED,
          time_updated: timestamp,
          api_id_updated: this.apiId,
        })
        .where({ item_id: itemId, user_id: this.userId });

      const row = await this.getSavedItemByIdRaw(itemId, transaction);
      if (row != null && this.flags.mirrorWrites) {
        await SavedItemDataService.syncShadowTable(row, transaction);
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Undelete a saved item. Check the time_read for the saved item to determine
   * which status the item is assigned when moved from the deleted state.
   * @param itemId
   */
  public async updateSavedItemUnDelete(
    itemId: string,
    updatedAt?: Date,
  ): Promise<SavedItem | null> {
    const timestamp = updatedAt ?? SavedItemDataService.formatDate(new Date());
    const query: any = await this.getSavedItemTimeRead(itemId);
    // Does not exist or was hard-deleted
    if (query == null) {
      return null;
    }
    // This is a check to determine if the saved item was previously archived. Fun, right?
    const status =
      query.time_read === 0 ? SavedItemStatus.UNREAD : SavedItemStatus.ARCHIVED;

    await this.db.transaction(async (trx) => {
      await trx('list')
        .update({
          status,
          time_updated: timestamp,
          api_id_updated: this.apiId,
        })
        .where({ item_id: itemId, user_id: this.userId });
      const row = await this.getSavedItemByIdRaw(itemId, trx);
      if (row != null && this.flags.mirrorWrites) {
        await SavedItemDataService.syncShadowTable(row, trx);
      }
    });
    return await this.getSavedItemById(itemId);
  }

  /**
   * @param item
   * @param savedItemUpsertInput
   * @returns savedItem
   */
  public async upsertSavedItem(
    item: ItemResponse,
    savedItemUpsertInput: SavedItemUpsertInput,
  ): Promise<SavedItem> {
    const currentDate = SavedItemDataService.formatDate(new Date());
    const givenTimestamp = new Date(savedItemUpsertInput.timestamp * 1000);
    const givenDate = savedItemUpsertInput.timestamp
      ? SavedItemDataService.formatDate(givenTimestamp)
      : currentDate;
    //`returning` is not supported for mysql in knex
    await this.db.transaction(async (trx) => {
      await trx('list')
        .insert({
          user_id: parseInt(this.userId),
          item_id: item.itemId,
          given_url: savedItemUpsertInput.url,
          status: 0,
          resolved_id: item.resolvedId,
          title: item.title,
          time_added: givenDate,
          time_updated: currentDate,
          time_read: '0000-00-00 00:00:00',
          time_favorited: savedItemUpsertInput.isFavorite
            ? givenDate
            : '0000-00-00 00:00:00',
          favorite: savedItemUpsertInput.isFavorite ? 1 : 0,
          api_id: parseInt(this.apiId),
          api_id_updated: parseInt(this.apiId),
        })
        .onConflict()
        .merge();
      const row = await this.getSavedItemByIdRaw(item.itemId, trx);
      if (row != null && this.flags.mirrorWrites) {
        await SavedItemDataService.syncShadowTable(row, trx);
      }
    });
    return await this.getSavedItemById(item.itemId.toString());
  }

  /**
   * Build a query to update the `time_updated` field of many items
   * the list table, by item id.
   * @param itemIds The item IDS to update the `time_Updated` to now.
   */
  public async updateListItemMany(
    itemIds: string[],
    trx: Knex.Transaction,
    timestamp?: Date,
  ) {
    const trxModifier = this.flags.mirrorWrites ? 2 : 1;
    const itemBatches = chunk(
      itemIds,
      config.database.maxTransactionSize / trxModifier,
    );
    itemBatches.flatMap(async (ids) => {
      if (this.flags.mirrorWrites) {
        await this.mirroredListItemUpdateMany(ids, trx, timestamp);
      } else {
        await this.listItemUpdateBuilder(timestamp)
          .whereIn('item_id', ids)
          .transacting(trx);
      }
    });
  }

  /**
   * Build a query to update the `time_updated` field of one item in
   * the list table, by item id.
   * @param itemId
   */
  public async updateListItemOne(
    itemId: string,
    trx: Knex.Transaction,
    timestamp?: Date,
  ): Promise<Knex.QueryBuilder> {
    if (this.flags.mirrorWrites) {
      await this.mirroredListItemUpdateOne(itemId, trx, timestamp);
    } else {
      await this.listItemUpdateBuilder()
        .where('item_id', itemId)
        .transacting(trx);
    }
  }

  /**
   * Get saved item IDs for a given user.
   * @param offset
   * @param limit
   */
  public getSavedItemIds(offset: number, limit: number) {
    return this.db('list')
      .where('user_id', this.userId)
      .orderBy('time_added', 'ASC')
      .limit(limit)
      .offset(offset)
      .pluck('item_id');
  }

  /**
   * Helper function to build updates to a user's list.
   * Used to mark updates that affect the list item (e.g. a new tag
   * association) but are not direct updates to the list table.
   * Does not include the necessary `join` or `where` statement
   * to properly execute this query.
   * Do not run this query as-is. Should only be used to compose other
   * queries.
   */
  public listItemUpdateBuilder(timestamp?: Date): Knex.QueryBuilder {
    return this.db
      .update({
        time_updated: SavedItemDataService.formatDate(timestamp ?? new Date()),
        api_id_updated: this.apiId,
      })
      .andWhere('user_id', this.userId)
      .from('list');
  }

  private async mirroredListItemUpdateOne(
    itemId: string,
    trx: Knex.Transaction,
    timestamp?: Date,
  ) {
    await trx('list')
      .update({
        time_updated: SavedItemDataService.formatDate(timestamp ?? new Date()),
        api_id_updated: this.apiId,
      })
      .where('item_id', itemId)
      .andWhere('user_id', this.userId);
    const updatedRow = await trx<RawListResult, RawListResult>('list')
      .select('*')
      .from('list')
      .where('item_id', itemId)
      .andWhere('user_id', this.userId)
      .first();
    await SavedItemDataService.syncShadowTable(updatedRow, trx);
  }

  private async mirroredListItemUpdateMany(
    itemIds: string[],
    trx: Knex.Transaction,
    timestamp?: Date,
  ) {
    await trx('list')
      .update({
        time_updated: SavedItemDataService.formatDate(timestamp ?? new Date()),
        api_id_updated: this.apiId,
      })
      .whereIn('item_id', itemIds)
      .andWhere('user_id', this.userId);
    const updatedRows = await trx<RawListResult, RawListResult>('list')
      .select('*')
      .from('list')
      .whereIn('item_id', itemIds)
      .andWhere('user_id', this.userId);
    await SavedItemDataService.syncShadowTableBulk(updatedRows, trx);
  }
}
