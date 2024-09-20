import {
  FirehoseClient,
  PutRecordBatchCommand,
  PutRecordBatchCommandOutput,
  _Record,
} from '@aws-sdk/client-firehose';
import config from '../config';
import { chunkArray } from './util';

export const encodeRecord = (event: { [key: string]: any }): _Record => {
  return {
    Data: new TextEncoder().encode(JSON.stringify(event) + '\n'),
  };
};

export const createRecords = (events: any[], accountId: string): _Record[] => {
  const records: _Record[] = [];

  events.forEach((event) => {
    records.push(encodeRecord({ ...event, accountId }));
  });

  return records;
};

// TODO: find sendgrid type for events?
export const deliver = async (
  events: any[],
  parameters: any,
  batchSize = 500,
): Promise<boolean> => {
  const firehoseClient = new FirehoseClient();
  const generator = chunkArray(events, batchSize);
  const promises: Promise<PutRecordBatchCommandOutput>[] = [];
  const { accountId } = parameters;

  let encodedRecords;
  let request: Promise<PutRecordBatchCommandOutput>;
  let current = generator.next();

  while (!current.done) {
    encodedRecords = createRecords(current.value, accountId);

    request = firehoseClient.send(
      new PutRecordBatchCommand({
        DeliveryStreamName: config.aws.firehose.deliveryStreamName,
        Records: encodedRecords,
      }),
    );

    promises.push(request);
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
