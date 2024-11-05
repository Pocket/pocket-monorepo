import {
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { S3Bucket } from '../s3Service';
import AdmZip from 'adm-zip';
import path from 'path';
import { sqs } from '../../aws/sqs';
import { config } from '../../config';
import { ImportMapping, ImportMessage } from './types';
import { chunk } from 'lodash';
import { nanoid } from 'nanoid';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';

export abstract class ImportBase {
  public sqsClient: SQSClient;
  constructor(
    public s3: S3Bucket,
    sqsClient?: SQSClient,
  ) {
    if (sqsClient != null) {
      this.sqsClient = sqsClient;
    } else {
      this.sqsClient = sqs;
    }
  }

  abstract start(): Promise<void>;

  /**
   * Load an archive from an S3 key and extract
   * the entries into memory
   * @param fileKey the key of the s3 object
   * @param prefix optional prefix for filtering which
   * files in the archive are returned
   * @returns
   */
  async loadArchive(
    fileKey: string,
    prefix?: string,
  ): Promise<AdmZip.IZipEntry[]> {
    const body = await this.s3.getObjectBody(fileKey);
    if (body == null) {
      return [];
    } else {
      const buffer = Buffer.from(await body.transformToByteArray());
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      if (prefix) {
        return entries.filter((entry) => {
          return path.basename(entry.entryName).startsWith(prefix);
        });
      } else {
        return entries;
      }
    }
  }

  /**
   * Send messages to the import queue. Sends a batch of 10 messages, and
   * each message payload has a batch of records of config.listImport.chunkSize
   * length.
   * @param records array of records which are, at minimum, urls to be imported
   * @param formatter callback for formatting records into the expected message
   * @param metadata additional metadata for logging and error reporting
   */
  async sendMessages<T extends keyof ImportMapping>(
    records: ImportMapping[T],
    formatter: (records: ImportMapping[T]) => ImportMessage<T>,
    metadata: { fileKey: string; userId: string; type: T },
  ) {
    // With a chunkSize of 100, we're getting messages that are too
    // large to send in batches of 10 (e.g. 847023 bytes when
    // 262144 is the max); batches of 2 seems safe
    // Sending in batches when we can reduces costs
    const batches = chunk(chunk(records, config.listImport.chunkSize), 2);
    let batchIx = 0;
    for await (const batch of batches) {
      const messages: SendMessageBatchRequestEntry[] = batch.map((records) => ({
        Id: nanoid(),
        MessageBody: JSON.stringify(formatter(records)),
      }));
      const command = new SendMessageBatchCommand({
        Entries: messages,
        QueueUrl: config.listImport.batchImportQueue,
      });
      try {
        const result = await this.sqsClient.send(command);
        if (result.Failed?.length) {
          serverLogger.error({
            message: 'Failed to enqueue batch import message',
            entry: result.Failed,
            fileKey: metadata.fileKey,
            type: metadata.type,
            batchIndex: batchIx * config.listImport.chunkSize,
          });
          Sentry.captureException('Failed to enqueue batch import message', {
            data: {
              fileKey: metadata.fileKey,
              messageIds: result.Failed.map((failure) => failure.Id),
              batchIndex: batchIx,
              type: 'omnivore',
            },
          });
        }
      } catch (error) {
        serverLogger.error({
          message: 'Request to batch import message queue failed',
          error: error,
          errorData: {
            message: error.message,
            userId: metadata.userId,
            batchIndex: batchIx,
          },
        });
        Sentry.captureException(error);
      } finally {
        batchIx += 1;
      }
    }
  }
}
