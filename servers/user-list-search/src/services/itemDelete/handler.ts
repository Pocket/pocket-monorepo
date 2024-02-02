import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processBody } from '../../tasks/userItemsDelete';
import { initSentry, captureException } from '../../sentry';

export const handler = async (event: SQSEvent): Promise<boolean[]> => {
  initSentry();

  try {
    return await Promise.all(
      event.Records.map((record: SQSRecord) => {
        return processBody(record.body);
      }),
    );
  } catch (err) {
    // unless we have a requirement to return a specific error response, just throw the exception after sentry is handled
    console.log('UserListSearch: error in lambda handler itemDelete', err);
    await captureException(err, {
      type: 'userListSearchItemDeleteHandler',
      data: {
        err,
        event,
      },
    });

    throw err;
  }
};
