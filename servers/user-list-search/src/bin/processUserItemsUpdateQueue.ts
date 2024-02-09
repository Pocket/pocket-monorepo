import { DataSourceInterface } from '../datasource/DataSourceInterface';
import { MysqlDataSource } from '../datasource/MysqlDataSource';
import { processMessages } from '../tasks/userItemsUpdate';

/**
 * Kicks off the polling process to continuously receive messages from the sqs queue
 */
(async (dataSource: DataSourceInterface): Promise<void> => {
  const run = true;
  while (run) {
    await processMessages(dataSource);
  }
})(new MysqlDataSource());
