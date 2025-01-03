import { Writable } from 'stream';
import { generateId, SQSBatchSendError } from './utils.ts';
import {
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SQS,
} from '@aws-sdk/client-sqs';

type SQSWritableStreamOptions = {
  sqsClient: SQS;
  queueUrl: string;
  sqsBatchSize?: number;
};

export default class SqsWritable extends Writable {
  sqsClient: SQS;
  queueUrl: string;
  sqsBatchSize = 10;
  buffer: SendMessageBatchRequestEntry[] = [];

  constructor(options: SQSWritableStreamOptions) {
    super({ objectMode: true });
    this.sqsClient = options.sqsClient;
    this.queueUrl = options.queueUrl;
    this.sqsBatchSize = options.sqsBatchSize || 10;
  }

  async send(entries: SendMessageBatchRequestEntry[]): Promise<void> {
    try {
      const result = await this.sqsClient.send(
        new SendMessageBatchCommand({
          Entries: entries,
          QueueUrl: this.queueUrl,
        }),
      );
      if (result.Failed && result.Failed.length) {
        throw new SQSBatchSendError('SQS Batch Send Error', result.Failed);
      }
    } catch (error) {
      this.emit('failedEntries', entries);
      const failedIds = entries.map((e) => e.Id);
      this.buffer = this.buffer.filter(
        (entry) => failedIds.indexOf(entry.Id) === -1,
      );
      throw error;
    }
  }

  async _write(chunk, encoding, callback): Promise<void> {
    try {
      if (typeof chunk === 'string') {
        this.buffer.push({
          Id: generateId(),
          MessageBody: chunk,
          // hack alert: because the parser does not immediately map a resolved id to
          // an item id, we are unable to retrieve any information related to that
          // resolved id (e.g. content & authors). to work around this delay on the parser's
          // side, we are delaying the availability of these messages here. like i
          // said, hack.
          DelaySeconds: 60,
        });
      } else if (Buffer.isBuffer(chunk)) {
        this.buffer.push({
          Id: generateId(),
          MessageBody: chunk.toString(),
          DelaySeconds: 60,
        });
      } else {
        this.buffer.push(chunk);
      }

      if (this.buffer.length >= this.sqsBatchSize) {
        await this.send(this.buffer);
        this.buffer = [];
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  async _final(callback): Promise<void> {
    try {
      if (this.buffer.length > 0) {
        await this.send(this.buffer);
        this.buffer = [];
      }

      return callback();
    } catch (error) {
      return callback(error);
    }
  }
}
