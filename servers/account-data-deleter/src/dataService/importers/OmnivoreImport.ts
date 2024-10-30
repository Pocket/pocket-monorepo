import { SQSClient } from '@aws-sdk/client-sqs';
import { S3Bucket } from '../s3Service';
import { ImportBase } from './ImportBase';
import { ImportMessage } from './types';

// A record in the omnivore metadata json export
export type OmnivoreImportRecord = {
  id: string;
  // Used as the key for highlights markdown files (<slug>.md)
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  url: string;
  state: 'Active' | 'Archived';
  readingProgress: number;
  thumbnail: string | null;
  labels: string[]; // empty if no labels exist
  savedAt: string; // ISO timestamp e.g. "2024-10-30T12:39:28.023Z"
  updatedAt: string; // ISO timestamp
  publishedAt: string | null; // ISO timestamp
};

export class OmnivoreImporter extends ImportBase {
  readonly userId: string;

  constructor(
    s3Bucket: S3Bucket,
    readonly fileKey: string,
    sqsClient?: SQSClient,
  ) {
    super(s3Bucket, sqsClient);
    // The format of the blob naming scheme is <userId>/<application>/<import-file>
    const userId = fileKey.split('/', 1)[0];
    if (userId == null) {
      throw Error('Unable to parse userId from import file');
    }
    this.userId = userId;
  }
  /**
   * Load an omnivore export archive file and extract all json metadata
   * records into a flat array
   * @returns an array of the json metadata records
   */
  async loadImport(): Promise<OmnivoreImportRecord[]> {
    const metadataFiles = await this.loadArchive(this.fileKey, 'metadata');
    const jsonRecords = metadataFiles.flatMap((entry) => {
      return JSON.parse(entry.getData().toString('utf8'));
    });
    return jsonRecords;
  }
  /**
   * Load import batches onto the queue.
   * if there are any failures, log them but don't throw.
   * It's likely a permissions issue.
   * The underlying import is retryable so we will just rely
   * on that for the most part.
   * @param records
   */
  async enqueueImport(records: OmnivoreImportRecord[]) {
    const formatter = (records: OmnivoreImportRecord[]) =>
      OmnivoreImporter.buildMessage(records, this.userId);
    await this.sendMessages(records, formatter, {
      fileKey: this.fileKey,
      userId: this.userId,
      type: 'omnivore',
    });
  }

  /**
   * Main entrypoint for the function
   */
  async start() {
    const records = await this.loadImport();
    await this.enqueueImport(records);
  }
  /**
   * Just for ensuring we use the types, since the message body
   * is otherwise an arbitrary string
   */
  static buildMessage(
    records: OmnivoreImportRecord[],
    userId: string,
  ): ImportMessage<'omnivore'> {
    return {
      userId: userId,
      records,
      importer: 'omnivore',
    };
  }
}
