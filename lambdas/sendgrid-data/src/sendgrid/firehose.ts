import AWS from 'aws-sdk';
import config from '../config';
import { chunkArray } from './util';

AWS.config.update({ region: config.aws.region });

export const encodeRecord = (event: {
  [key: string]: any;
}): AWS.Firehose.Types.Record => {
  return {
    Data: JSON.stringify(event) + '\n',
  };
};

export const createRecords = (
  events: any[],
  accountId: string
): AWS.Firehose.Types.PutRecordBatchRequestEntryList => {
  const records: any[] = [];

  events.forEach((event) => {
    records.push(encodeRecord({ ...event, accountId }));
  });

  return records;
};

// TODO: find sendgrid type for events?
export const deliver = async (
  events: any[],
  parameters: any,
  batchSize = 500
): Promise<boolean> => {
  const firehoseClient = new AWS.Firehose();
  const generator = chunkArray(events, batchSize);
  const promises = [];
  const { accountId } = parameters;

  let encodedRecords;
  let request;
  let current = generator.next();

  while (!current.done) {
    encodedRecords = createRecords(current.value, accountId);

    request = firehoseClient.putRecordBatch({
      DeliveryStreamName: config.aws.firehose.deliveryStreamName,
      Records: encodedRecords,
    });

    promises.push(request.promise());
    current = generator.next();
  }

  return Promise.all(promises)
    .then((data) => {
      return true;
    })
    .catch((err) => {
      return false;
    });
};
