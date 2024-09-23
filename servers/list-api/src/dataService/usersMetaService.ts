import { Knex } from 'knex';
import { IContext } from '../server/context';
import { mysqlTimeString } from './utils';
import config from '../config';
import { DateTime } from 'luxon';

export class UsersMetaService {
  private static propertiesMap = {
    tag: 18, // keeps track of last time a tag was added/deleted/updated
  };
  private static tableName = 'users_meta';

  private db: Knex.QueryBuilder;
  private knex: Knex;
  private readonly userId: string;

  constructor(context: IContext) {
    this.userId = context.userId;
    this.knex = context.writeClient;
    this.db = context.writeClient(UsersMetaService.tableName);
  }

  /**
   * Delete a row by user_id and property. Ensures uniqueness on these two
   * fields (e.g. if you only want to track the last time a tag was changed)
   * @param property numerical code that identifies the tracked property
   */
  private deleteByProperty(property: number): Knex.QueryBuilder {
    return this.db.where({ user_id: this.userId, property: property }).del();
  }

  /**
   * Inserts a timestamp into the users_meta table.
   * @param property numerical code for identifying the tracked property
   * @param timestamp timestamp at which the tracked change occurred
   */
  private insertTimestampByProperty(
    property: number,
    timestamp: Date,
  ): Knex.QueryBuilder {
    return this.db.upsert({
      user_id: this.userId,
      property: property,
      value: mysqlTimeString(timestamp, config.database.tz),
      time_updated: this.knex.fn.now(), // Web repo uses NOW() instead of server timestamp
    });
  }

  /**
   * Log the last time a tag mutation occured.
   * There should only be one entry for the unique combination of user_id:property
   * Since this should only be updated as a side-effect of another mutation, require
   * a transaction object to conduct the entire operation atomically.
   * @param timestamp timestamp server processed mutation
   * @param trx
   */
  public async logTagMutation(
    timestamp: Date,
    trx: Knex.Transaction,
  ): Promise<void> {
    const propertyCode = UsersMetaService.propertiesMap.tag;
    // The table should be unique on property:user_id for tag log
    await this.deleteByProperty(propertyCode).transacting(trx);
    await this.insertTimestampByProperty(propertyCode, timestamp).transacting(
      trx,
    );
  }

  /**
   * Upsert a record into the tag log.
   * Used for updating the tag sync record as a side-effect of the
   * v3 tagslist sync query, not a mutation.
   * It should only be called when there is not a record, but just
   * in case we will merge (upsert) on conflict.
   */
  public async upsertTagLog(timestamp: Date) {
    await this.insertTimestampByProperty(
      UsersMetaService.propertiesMap.tag,
      timestamp,
    );
  }

  /**
   * Fetch the last time a change to tags was recorded.
   * Returns undefined if no changes to tags have occurred
   * for the user (e.g. they don't have any)
   */
  public async lastTagMutationTime(): Promise<Date | undefined> {
    const row = await this.db
      .where({
        user_id: this.userId,
        property: UsersMetaService.propertiesMap.tag,
      })
      .select()
      .first();
    if (row == null) return undefined;
    return DateTime.fromSQL(row.value, { zone: config.database.tz }).toJSDate();
  }
}
