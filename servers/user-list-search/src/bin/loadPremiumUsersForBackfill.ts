import { DataSourceInterface } from '../datasource/DataSourceInterface.js';
import { MysqlDataSource } from '../datasource/MysqlDataSource.js';
import { run } from '../tasks/queueAllPremiumUsers.js';

/**
 * Kicks off loading all premium users into the backfill queue
 */
(async (dataSource: DataSourceInterface): Promise<void> => {
  await run(dataSource);
})(new MysqlDataSource());
