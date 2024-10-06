import { Knex } from 'knex';
import { IContext } from '../server/context';
import { mysqlDateConvert, mysqlTimeString, setDifference } from './utils';
import { PocketSaveStatus } from '../types';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import config from '../config';

import {
  ListResult,
  RawListResult,
  ListArchiveUpdate,
  ListFavoriteUpdate,
  FavoriteStatus,
} from './types';
/**
 * Make PocketSaveStatus enums
 * to the desired status string.
 */
const statusMap = {
  [PocketSaveStatus.UNREAD]: 'UNREAD',
  [PocketSaveStatus.ARCHIVED]: 'ARCHIVED',
  [PocketSaveStatus.DELETED]: 'DELETED',
  [PocketSaveStatus.HIDDEN]: 'HIDDEN',
};

/**
 * Convert the given raw MySQL list row into the desired list row types.
 * Converts status ints into desired PocketSaveStatus enum strings.
 * Converts MySQL date responses into validated Typescript Date objects,
 * filtering out (returning null) values like '0000-00-00 00:00:00'.
 * @param row
 */
const convert = (row: RawListResult) => {
  const result: ListResult = {
    api_id: row.api_id,
    api_id_updated: row.api_id_updated,
    favorite: row.favorite,
    given_url: row.given_url,
    item_id: row.item_id,
    resolved_id: row.resolved_id,
    status: statusMap[row.status],
    time_added: mysqlDateConvert(row.time_added) ?? new Date(),
    time_favorited: mysqlDateConvert(row.time_favorited),
    time_read: mysqlDateConvert(row.time_read),
    time_updated: mysqlDateConvert(row.time_updated) ?? new Date(),
    title: row.title,
    user_id: row.user_id,
  };
  return result;
};

/***
 * class that handles the read and write from `readitla-temp.list` table
 * note: for mutations, please pass the writeClient, otherwise there will be replication lags.
 */
export class PocketSaveDataService {
  private db: Knex;
  private readonly apiId: string;
  private readonly userId: string;
  private readonly selectCols: Array<keyof RawListResult> = [
    'api_id',
    'api_id_updated',
    'favorite',
    'given_url',
    'item_id',
    'resolved_id',
    'status',
    'time_added',
    'time_favorited',
    'time_read',
    'time_updated',
    'title',
    'user_id',
  ];

  // For release/toggle flags
  private flags: Record<string, boolean>;
  constructor(
    private context: Pick<
      IContext,
      'apiId' | 'dbClient' | 'userId' | 'unleash'
    >,
  ) {
    this.apiId = context.apiId;
    this.db = context.dbClient;
    this.userId = context.userId;
    this.flags = {};
  }

  public static convertListResult(listResult: null): null;
  public static convertListResult(listResult: RawListResult): ListResult;
  public static convertListResult(listResult: RawListResult[]): ListResult[];
  /**
   * Convert the `status` field in the list table to the expected
   * GraphQL ENUM string
   * @param listResult
   */
  public static convertListResult(
    listResult: RawListResult | RawListResult[] | null,
  ): ListResult | ListResult[] | null {
    if (listResult === undefined || listResult === null) {
      return null;
    }

    if (listResult instanceof Array) {
      return listResult.map((row) => convert(row));
    }
    return convert(listResult);
  }

  /**
   * Helper function to build repeated queries, for DRY pocketSave and pocketSaves fetches.
   * Will eventually be extended for building filter, sorts, etc. for different pagination, etc.
   * For now just to reuse the same query and reduce testing burden :)
   */
  public buildQuery(): Knex.QueryBuilder<RawListResult, RawListResult[]> {
    return this.db('list').select(this.selectCols);
  }

  /**
   * Fetch List Table Rows By IDs (user id x item_id)
   * @param itemIds the pocketSave IDs to fetch
   */
  public async getListRowsById(itemIds: string[]): Promise<ListResult[]> {
    const query = await this.buildQuery()
      .whereIn('item_id', itemIds)
      .andWhere('user_id', this.userId);
    return PocketSaveDataService.convertListResult(query);
  }

  /**
   * Batch update to set status of saves in a user's list to ARCHIVED.
   * Requires all IDs in the batch to be valid; otherwise will roll back
   * transaction and return missing IDs, for use in NOT_FOUND response
   * in business layer.
   * If the row was already ARCHIVED status, the method is a "no-op"
   * (e.g. does not reset the time_read, time_updated, or api_id_updated values)
   */
  public async archiveListRow(
    ids: number[],
    timestamp: Date,
  ): Promise<{ updated: ListResult[]; missing: string[] }> {
    const timeUpdate = mysqlTimeString(timestamp, config.database.tz);
    const updateValues: ListArchiveUpdate = {
      status: PocketSaveStatus.ARCHIVED,
      time_read: timeUpdate,
      time_updated: timeUpdate,
      api_id_updated: this.apiId,
    };

    return await this.writeToDatabase(
      updateValues,
      ids,
      'status',
      PocketSaveStatus.ARCHIVED,
    );
  }

  /**
   * Batch update to set status of saves in a user's list to UNREAD.
   * Requires all IDs in the batch to be valid; otherwise will roll back
   * transaction and return missing IDs, for use in NOT_FOUND response
   * in business layer.
   * If the row was already UNREAD status, the method is a "no-op"
   * (e.g. does not reset the time_read, time_updated, or api_id_updated values)
   */
  public async unArchiveListRow(
    ids: number[],
    timestamp: Date,
  ): Promise<{ updated: ListResult[]; missing: string[] }> {
    const timeUpdate = mysqlTimeString(timestamp, config.database.tz);
    const updateValues: ListArchiveUpdate = {
      status: PocketSaveStatus.UNREAD,
      time_read: timeUpdate,
      time_updated: timeUpdate,
      api_id_updated: this.apiId,
    };

    return await this.writeToDatabase(
      updateValues,
      ids,
      'status',
      PocketSaveStatus.UNREAD,
    );
  }

  /**
   * Batch update to set status of saves in a user's list to favorited.
   * Requires all IDs in the batch to be valid; otherwise will roll back
   * transaction and return missing IDs, for use in NOT_FOUND response
   * in business layer.
   * If the row was already favorite, the method is a "no-op"
   * (e.g. does not reset the time_favorited, time_updated, or api_id_updated values)
   */
  public async favoriteListRow(
    ids: number[],
    timestamp: Date,
  ): Promise<{ updated: ListResult[]; missing: string[] }> {
    const timeUpdate = mysqlTimeString(timestamp, config.database.tz);
    const updateValues: ListFavoriteUpdate = {
      favorite: FavoriteStatus.FAVORITE,
      time_favorited: timeUpdate,
      time_updated: timeUpdate,
      api_id_updated: this.apiId,
    };
    return await this.writeToDatabase(
      updateValues,
      ids,
      'favorite',
      FavoriteStatus.FAVORITE,
    );
  }

  /**
   * Batch update to set status of saves in a user's list to not favorited.
   * Requires all IDs in the batch to be valid; otherwise will roll back
   * transaction and return missing IDs, for use in NOT_FOUND response
   * in business layer.
   * If the row was already not favorited, the method is a "no-op"
   * (e.g. does not reset the time_updated, or api_id_updated values)
   */
  public async unFavoriteListRow(
    ids: number[],
    timestamp: Date,
  ): Promise<{ updated: ListResult[]; missing: string[] }> {
    const timeUpdate = mysqlTimeString(timestamp, config.database.tz);
    const updateValues: ListFavoriteUpdate = {
      favorite: FavoriteStatus.UNFAVORITE,
      time_favorited: null,
      time_updated: timeUpdate,
      api_id_updated: this.apiId,
    };
    return await this.writeToDatabase(
      updateValues,
      ids,
      'favorite',
      FavoriteStatus.UNFAVORITE,
    );
  }

  /**
   * Writes the update to the database
   * If the value is not found, throws a NOT_FOUND error
   * Skips the row whose value is already set.
   * @param updateValues fields to be updated in the database
   * @param ids savesId to be updated
   * @param checkField database field to check if the field is already set
   * @param value skip row if the value matches
   * @private
   */
  private async writeToDatabase(
    updateValues: ListFavoriteUpdate | ListArchiveUpdate,
    ids: number[],
    checkField: 'status' | 'favorite',
    value: FavoriteStatus | PocketSaveStatus,
  ): Promise<{ updated: ListResult[]; missing: string[] }> {
    // Initialize in outer scope so we can access outside of the
    // try/catch block and transaction block
    let updated: RawListResult[] = [];
    let missing: string[] = [];

    try {
      await this.db.transaction(async (trx) => {
        await trx('list')
          .update(updateValues)
          .whereIn('item_id', ids)
          .andWhere('user_id', this.userId)
          // Don't change any rows that has same value
          .andWhere(checkField, '!=', value);

        updated = await trx<RawListResult>('list')
          .select(this.selectCols)
          .whereIn('item_id', ids)
          .andWhere('user_id', this.userId);

        // Batches should be atomic -- roll back transaction if
        // there is an update that can't succeed due to value not
        // being present
        if (updated.length !== ids.length) {
          throw new NotFoundError('At least one ID was not found');
        }
      });
    } catch (error) {
      // Capture NotFoundError thrown by inner block, and use response
      // prior to transaction rollback to determine which IDs are missing
      if (error instanceof NotFoundError) {
        const extantIds = new Set(updated.map((row) => row.item_id));
        missing = setDifference(new Set(ids), extantIds).map((id) =>
          id.toString(),
        );
        // The transaction was rolled back; reset values
        updated = [];
      } else {
        // Re-throw for resolver layer -- this is an internal server error
        throw error;
      }
    }
    return {
      updated: PocketSaveDataService.convertListResult(updated),
      missing,
    };
  }
  /**
   * Check whether a set of item_ids exist in a user's saves.
   * Returns any input IDs which were not found.
   * @param ids
   */
  public async checkIdExists(ids: number[]): Promise<number[]> {
    const extantIds: number[] = await this.db('list')
      .select('item_id')
      .whereIn('item_id', ids)
      .andWhere('user_id', this.userId)
      .pluck('item_id');
    return setDifference(new Set(ids), new Set(extantIds));
  }
}
