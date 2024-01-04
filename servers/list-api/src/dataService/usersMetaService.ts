import { Knex } from 'knex';
import { IContext } from '../server/context';
import { mysqlTimeString } from './utils';
import config from '../config';

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
    this.knex = context.dbClient;
    this.db = context.dbClient(UsersMetaService.tableName);
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
    return this.db.insert({
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
}
