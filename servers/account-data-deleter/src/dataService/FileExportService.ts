import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { serverLogger } from '@pocket-tools/ts-logger';
import type { Knex } from 'knex';
import { S3Bucket } from './s3Service';
import { config } from '../config';
import { sqs } from '../aws/sqs';
import { ExportMessage } from '../types';
import path from 'path';
import * as Sentry from '@sentry/node';
import {
  ExportPartComplete,
  PocketEventBridgeClient,
  PocketEventType,
} from '@pocket-tools/event-bridge';

/**
 * Export a User's list data.
 * Data will be exported in chunks and saved in s3, keyed under
 * the user's encodedId (e.g. <export-bucket>/<parts-prefix>/<encodedId>/part_0000.csv)
 * When all data has been exported, the individual CSVs will be compiled
 * into one zip archive, keyed with their encodedId
 * (e.g. <export-bucket>/<archive-prefix>/<encodedId/pocket.zip)
 */
export abstract class FileExportService<I extends { cursor: number }, O> {
  abstract serviceName: ExportPartComplete['detail']['service'];

  constructor(
    protected readonly userId: number,
    protected readonly encodedId: string,
    protected readonly db: Knex,
    protected readonly exportBucket: S3Bucket,
    protected readonly eventBridge: PocketEventBridgeClient,
  ) {}

  protected get partsPrefix(): string {
    return path.join(config.listExport.partsPrefix, this.encodedId);
  }

  abstract fileKey(part: number): string;

  abstract fetchData(from: number, size: number): Promise<Array<I>>;

  abstract formatExport(entries: I[]): O[];

  abstract write(records: O[], fileKey: string): Promise<void>;

  /**
   * Save a chunk of list data for export.
   * @param requestId ID for tracking the request
   * @param fromId cursor for pagination
   * @param size page size
   * @param part numeric part, for file naming
   * @returns true if successful, false if an error occurred
   */
  async exportListChunk(
    requestId: string,
    fromId: number,
    size: number,
    part: number,
  ) {
    Sentry.addBreadcrumb({ data: { cursor: fromId, part, requestId } });
    try {
      const entries = await this.fetchData(fromId, size);
      // There's no data
      if (entries.length === 0) {
        if (part === 0) {
          serverLogger.info({
            message: `DataExportService::${this.serviceName} - export complete (no data)`,
            requestId,
          });
          await this.notifyComplete(
            this.encodedId,
            requestId,
            this.partsPrefix,
          );
        } else {
          serverLogger.warn(
            `DataExportService::${this.serviceName} - Export returned no results`,
          );
        }
      }
      // We're finished!
      else if (entries.length <= size) {
        const records = this.formatExport(entries);
        await this.write(records, this.fileKey(part));
        await this.notifyComplete(this.encodedId, requestId, this.partsPrefix);
      } else {
        // Will pull in greater than or equal to cursor
        // Updates array in-place to remove the record
        const cursor = entries.splice(size)[0].cursor;
        const records = this.formatExport(entries);
        await this.write(records, this.fileKey(part));
        serverLogger.info({
          message: `DataExportService::${this.serviceName} - Requesting next chunk`,
          requestId,
          cursor,
          part: part + 1,
        });
        await this.requestNextChunk(requestId, cursor, part + 1);
      }
    } catch (err) {
      serverLogger.error({
        message: `DataExportService::${this.serviceName} - Unhandled error occurred during export`,
        errorData: err,
        cursor: fromId,
        part,
        requestId: requestId,
      });
      Sentry.captureException(err);
      throw err;
    }
    return true;
  }
  // Put a message onto the queue to trigger the next batch
  async requestNextChunk(requestId: string, fromId: number, part: number) {
    const body: ExportMessage = {
      userId: this.userId.toString(),
      requestId,
      encodedId: this.encodedId,
      cursor: fromId,
      part,
    };
    const command = new SendMessageCommand({
      MessageBody: JSON.stringify(body),
      QueueUrl: config.aws.sqs.listExportQueue.url,
    });
    await sqs.send(command);
    return;
  }
  // Put notify of status update
  async notifyComplete(encodedId: string, requestId: string, prefix: string) {
    const payload: ExportPartComplete = {
      'detail-type': PocketEventType.EXPORT_PART_COMPLETE,
      source: 'account-data-deleter',
      detail: {
        encodedId,
        requestId,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        prefix,
      },
    };
    try {
      await this.eventBridge.sendPocketEvent(payload);
    } catch (err) {
      serverLogger.error({
        message: `DataExportService::${this.serviceName} - Error sending export-part-ready event`,
        errorData: err,
        payload,
      });
      Sentry.captureException(err, { data: { payload } });
      // Re-throw for calling function
      throw err;
    }
  }
}
