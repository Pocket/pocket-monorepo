import { Knex } from 'knex';
import { IContext } from '../server/apollo/context';
import { mysqlTimeString } from './utils';
import config from '../config';

export class SavedItem {
  private readonly userId: string;
  private readonly apiId: string;

  constructor(context: Pick<IContext, 'userId' | 'apiId'>) {
    this.userId = context.userId;
    this.apiId = context.apiId;
  }

  /**
   * Helper function to mark saved item updates.
   * Used to mark annotations updates
   * Since this should only be updated as a side effect of another mutation, require
   * a transaction object to conduct the entire operation atomically.
   */
  public async markUpdate(
    itemId: string,
    date: Date,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('list')
      .update({
        time_updated: mysqlTimeString(date, config.database.tz),
        api_id_updated: this.apiId,
      })
      .where({ item_id: itemId, user_id: this.userId });
  }
}
