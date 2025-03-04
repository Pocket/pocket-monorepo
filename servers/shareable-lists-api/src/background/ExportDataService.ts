import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';
import path from 'path';
import {
  ExportPartComplete,
  PocketEventBridgeClient,
  PocketEventType,
} from '@pocket-tools/event-bridge';
import { S3Bucket } from '../aws/S3Bucket';
import { ExportMessage } from './types';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';
import { sqs } from '../aws/sqs';
import config from '../config';

type ListExportEntry = {
  description: string;
  slug: string;
  title: string;
  createdAt: Date;
  cursor: number;
};

export class ExportDataService {
  constructor(
    private readonly userId: number,
    private readonly encodedId: string,
    private readonly db: Kysely<DB>,
    private readonly exportBucket: S3Bucket,
    private readonly eventBridge: PocketEventBridgeClient,
  ) {}
  private get partsPrefix(): string {
    return path.join(config.export.bucket.partsPrefix, this.encodedId);
  }

  /**
   * Get a page of lists
   * @param fromId the listId to start with as the cursor
   * @param size the max number of lists to pull
   * @returns ListExportEntry[]
   */
  private async getLists(fromId: number, size: number) {
    return await this.db
      .selectFrom('List')
      .select(['description', 'slug', 'title', 'id as cursor', 'createdAt'])
      .where('userId', '=', this.userId)
      .where('id', '>=', fromId)
      .orderBy('id', 'asc')
      .limit(size + 1)
      .execute();
  }

  /**
   * Get the metadata of the items in a list.
   * There's no limit on this -- we assume that a list will
   * fit in memory without issue. This is potentially problematic
   * as list sizes were never enforced, but based on actual data
   * we should be ok since we're only loading one list at a time
   * in each iteration.
   * @param listId the id of the list to retrieve items for
   * @returns the items associated to a list, with select metadata fields
   */
  private async getListItems(listId: number) {
    return await this.db
      .selectFrom('ListItem')
      .select(['url', 'title', 'excerpt', 'note'])
      .where('listId', '=', listId)
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')
      .execute();
  }
  private async exportListFiles(lists: ListExportEntry[]) {
    for await (const list of lists) {
      const items = await this.getListItems(list.cursor);
      const listExport = {
        title: list.title,
        description: list.description,
        createdAt: list.createdAt.toISOString(),
        items,
      };
      const key = path.join(this.partsPrefix, 'collections', list.slug);
      await this.exportBucket.writeJson(listExport, key);
    }
  }

  /**
   * Process a chunk of lists, corresponding to a message
   * in the work queue. Write the lists to S3, and either
   * schedule next work or notify of completion.
   * @param requestId
   * @param fromId
   * @param size
   * @param part
   * @returns true if successful, otherwise error for poll handler
   */
  async processChunk(
    requestId: string,
    fromId: number,
    size: number,
    part: number,
  ) {
    try {
      Sentry.addBreadcrumb({ data: { cursor: fromId, part, requestId } });
      const lists = await this.getLists(fromId, size);
      // There's no data
      if (lists.length === 0) {
        if (part === 0) {
          serverLogger.info({
            message: 'ExportDataService - export complete (no data)',
            requestId,
          });
          await this.notifyComplete(
            this.encodedId,
            requestId,
            this.partsPrefix,
          );
        } else {
          serverLogger.warn('Export returned no results');
        }
      } // We're finished!
      else if (lists.length <= size) {
        await this.exportListFiles(lists);
        await this.notifyComplete(this.encodedId, requestId, this.partsPrefix);
      } else {
        // Will pull in greater than or equal to cursor
        const cursor = lists.splice(size)[0].cursor;
        await this.exportListFiles(lists);
        serverLogger.info({
          message: 'ExportDataService - Requesting next chunk',
          requestId,
          cursor,
          part: part + 1,
        });
        await this.requestNextChunk(requestId, cursor, part + 1);
      }
    } catch (error) {
      serverLogger.error({
        message: 'Error occurred while fetching and writing data for export',
        errorData: error,
        cursor: fromId,
        part,
        requestId: requestId,
      });
      Sentry.captureException(error);
      throw error;
    }
    return true;
  }
  /** Put a message onto the queue to trigger the next batch **/
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
      QueueUrl: config.export.workQueue.url,
    });
    await sqs.send(command);
    return;
  }
  /** Emit event to notify that this service has completed its export, to be
   * consumed by the export service state manager.
   */
  async notifyComplete(encodedId: string, requestId: string, prefix: string) {
    const payload: ExportPartComplete = {
      'detail-type': PocketEventType.EXPORT_PART_COMPLETE,
      source: 'shareable-lists',
      detail: {
        encodedId,
        requestId,
        service: 'shareable-lists',
        timestamp: new Date().toISOString(),
        prefix,
      },
    };
    try {
      await this.eventBridge.sendPocketEvent(payload);
    } catch (err) {
      serverLogger.error({
        message: 'Error sending export-part-complete event',
        errorData: err,
        payload,
      });
      Sentry.captureException(err, { data: { payload } });
      // Re-throw for calling function
      throw err;
    }
  }
}
