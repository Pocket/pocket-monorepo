import { Knex } from 'knex';
import * as Sentry from '@sentry/node';
import { indexedTables } from '../config/tables';
import { config } from '../config';
import { setTimeout } from 'timers/promises';
import Logger from '../logger';

interface LimitOverridesConfig {
  limit: number;
  table: string;
}

export type TablePrimaryKeyModel = {
  primaryKeyNames: string[];
  primaryKeyValues: any[][];
};

export class AccountDeleteDataService {
  private readonly db: Knex;
  private readonly userId: number;
  constructor(userId: number, dbClient: Knex) {
    this.db = dbClient;
    this.userId = userId;
  }

  /**
   * Fetch the name of the primary key column
   * @param table contains table name in the format: "tableSchema.tableName"
   * @returns name of primary key column, or combination of columns that
   * compose primary key
   */
  private async getPrimaryKey(table: string): Promise<string[]> {
    const tableSchema = table.split('.')[0];
    const tableName = table.split('.')[1];

    const primaryKeys: string[] = await this.db(`information_schema.COLUMNS`)
      .select(`COLUMN_NAME`)
      .where(`TABLE_NAME`, tableName)
      .andWhere(`TABLE_SCHEMA`, tableSchema)
      .andWhere(`COLUMN_KEY`, 'PRI')
      .pluck('COLUMN_NAME');

    return primaryKeys;
  }

  public getIndexColumnForTables(table: string): string[] {
    const lookup = indexedTables[table];
    if (lookup !== undefined) {
      return [...indexedTables[table]];
    }

    Logger.error({
      message: 'getIndexColumnForTables: lookup failed.',
      data: {
        table: table,
        indexedTables: indexedTables,
      },
    });
    return [];
  }

  /***
   * For the given tableName, we retrieve the primary key column name.
   * Then, for the table, we order the table based on all the primary keys
   * ( either single or composite) and return the first primary key name
   * and their values.
   * Note: we are batching the values of the primary key by using offset and limits.
   * @param table contains table name in the format: "tableSchema.tableName"
   * @param offset offset from which the primary key values are batched
   * @param where where statement used to select subset of table; typically
   * a user identifier like id or email address.
   * @param limit query limit
   */
  public async getTableIds(
    table: string,
    offset: number,
    where: Record<string, string | number>,
    limit = config.queueDelete.queryLimit,
  ): Promise<TablePrimaryKeyModel> {
    let keyColumns: string[] = await this.getPrimaryKey(table);
    if (keyColumns.length == 0) {
      // if the table doesn't have a primary key,
      // then fetch index column
      // The `where` condition must always be added if not PK,
      // since the key is not guaranteed to identify a
      // unique row and could potentially delete data intended to be kept
      keyColumns = this.getIndexColumnForTables(table);
      keyColumns.push(...Object.keys(where));
    }

    // the distinct is necessary to handle cases where the combination of keys
    // is not a PK (e.g. can point to more than one row)
    let baseQuery = this.db(table).select(keyColumns).where(where).distinct();

    keyColumns.forEach((pk) => {
      //order by all key values
      baseQuery = baseQuery.orderBy(pk);
    });

    const pkRows = await baseQuery.limit(limit).offset(offset);
    const pkModel: TablePrimaryKeyModel = {
      primaryKeyNames: keyColumns,
      primaryKeyValues: [],
    };

    pkRows.forEach((row) => {
      const list = keyColumns.map((pk) => row[pk]);
      pkModel.primaryKeyValues.push(list);
    });

    return pkModel;
  }

  /**
   * Deletes rows provided for the given table and columnName:columnValue
   * pairs.
   * Sleep between deletes so replication lags can catch up.
   * If the delete for a single record fails, we log the error and move on to
   * the next record
   * @param tableName
   * @param where object containing column name(s) composing primary key
   * mapped to the value of that column; rows corresponding to
   * these records will be deleted
   * @param requestId requestId of /batchDelete post request.
   */
  public async batchDeleteUserInformation(
    tableName: string,
    where: TablePrimaryKeyModel,
    requestId: string,
    limitOverridesConfig: LimitOverridesConfig[],
  ): Promise<void> {
    try {
      const tempModel: TablePrimaryKeyModel = {
        primaryKeyNames: where.primaryKeyNames,
        primaryKeyValues: where.primaryKeyValues,
      };

      // safeguard against messages with primaryKeyValues arrays
      // that are longer than queueDelete list length settings
      // if non-default (e.g. case where db could handle poorly)
      const limitOverride: number =
        limitOverridesConfig.find((lo) => lo.table === tableName)?.limit ??
        Infinity;
      const listTooLong: boolean =
        where.primaryKeyValues.length >= limitOverride;

      // break apart deleteByKeys into multiple if length of where values is too long
      if (listTooLong) {
        const compliantWhereKeyValues: any[][] = [];
        for (let i = 0; i < where.primaryKeyValues.length; i += limitOverride) {
          const chunk = where.primaryKeyValues.slice(i, i + limitOverride);
          compliantWhereKeyValues.push(chunk);
        }
        for (const compliantWhereKeyValue of compliantWhereKeyValues) {
          const compliantTempModel: TablePrimaryKeyModel = {
            primaryKeyNames: where.primaryKeyNames,
            primaryKeyValues: compliantWhereKeyValue,
          };
          await this.deleteByKeys(tableName, compliantTempModel);
        }
      } else {
        await this.deleteByKeys(tableName, tempModel);
      }
    } catch (error) {
      const errorMessage = `BatchDelete: error deleting row for given data.`;
      const errorData = {
        table: tableName,
        whereCondition: where,
        requestId: requestId,
      };
      Logger.error({ message: errorMessage, error: error, data: errorData });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      Sentry.captureException(error);
    }
  }
  /**
   * Internal class delete query so that it's easier to test the error logging,
   * since knex is a PITA to mock.
   * We are deleting one record at a time, coz the mysql query optimizer
   * does a table scan instead of delete by primary key if we do a batch delete
   * of multiple records.
   */
  public async deleteByKeys(tableName: string, where: TablePrimaryKeyModel) {
    const query = this.db(tableName)
      .delete()
      .whereIn(where.primaryKeyNames, where.primaryKeyValues);
    const rowCount = await query;

    /* eslint-disable max-len */
    const successMessage = `deleted rows for ${tableName} with provided where condition.`;
    /* eslint-enable max-len */
    Logger.info({ message: successMessage, data: where });
    return rowCount;
  }

  /**
   * sleeps for the given time in milli seconds.
   * wrapped in a method to make it easier for creating test stub
   * @param timeInMilliSecs
   */
  public async delay(timeInMilliSecs: number) {
    await setTimeout(timeInMilliSecs);
  }
}
