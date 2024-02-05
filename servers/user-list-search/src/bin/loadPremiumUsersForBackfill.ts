import { DataSourceInterface } from '../datasource/DataSourceInterface';
import { MysqlDataSource } from '../datasource/MysqlDataSource';
import { run } from '../tasks/queueAllPremiumUsers';
import { initSentry } from '../sentry';

/**
 * Initialize Sentry
 */
initSentry();

/**
 * Kicks off loading all premium users into the backfill queue
 */
(async (dataSource: DataSourceInterface): Promise<void> => {
  await run(dataSource);
})(new MysqlDataSource());
