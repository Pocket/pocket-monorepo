import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processBody } from '../../tasks/userListImport';
import { MysqlDataSource } from '../../datasource/MysqlDataSource';
import { initSentry, captureException } from '../../sentry';

const mysql = new MysqlDataSource();

export const handler = async (event: SQSEvent): Promise<boolean[]> => {
  initSentry();

  try {
    return await Promise.all(
      event.Records.map((record: SQSRecord) => {
        return processBody(record.body, mysql);
      }),
    );
  } catch (err) {
    // unless we have a requirement to return a specific error response, just throw the exception after sentry is handled
    console.log('UserListSearch: error in lambda handler userListImport', err);
    await captureException(err, {
      type: 'userListSearchItemUpdateHandler',
      data: {
        err,
        event,
      },
    });

    throw err;
  }
};
