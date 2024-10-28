import { SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { serverLogger } from '@pocket-tools/ts-logger';
import type { Knex } from 'knex';
import { S3Bucket } from './s3Service';
import { config } from '../config';
import { sqs } from '../aws/sqs';
import { ExportMessage } from '../types';
import path from 'path';
import * as Sentry from '@sentry/node';

type ListExportEntry = {
  url: string;
  title: string;
  time_added: number; // seconds from epoch
  status: 'archive' | 'unread';
  tags: string; // concatenated array of tags, pipe-separated
};

/**
 * Export a User's list data.
 * Data will be exported in chunks and saved in s3, keyed under
 * the user's encodedId (e.g. <export-bucket>/<parts-prefix>/<encodedId>/part_0000.csv)
 * When all data has been exported, the individual CSVs will be compiled
 * into one zip archive, keyed with their encodedId
 * (e.g. <export-bucket>/<archive-prefix>/<encodedId/pocket.zip)
 */
export class ListDataExportService {
  constructor(
    private readonly userId: number,
    private readonly encodedId: string,
    private readonly db: Knex,
    private readonly exportBucket: S3Bucket,
    private readonly eventBridge: EventBridgeClient,
  ) {}

  /**
   * Naming scheme for export archive file
   */
  private get zipFileKey(): string {
    return path.join(
      config.listExport.archivePrefix,
      this.encodedId,
      'pocket.zip',
    );
  }
  private get partsPrefix(): string {
    return path.join(config.listExport.partsPrefix, this.encodedId);
  }

  /**
   * Fetch a page of data from a User's list, to build the export file
   * @param from cursor value to paginate from (inclusive, ascending)
   * @param size size of page
   * @returns Promise<Array<ListExportEntry & { cursor: number }>
   */
  async fetchListData(
    from: number,
    size: number,
  ): Promise<Array<ListExportEntry & { cursor: number }>> {
    const query = this.db('list')
      .select(
        this.db.raw(
          `COALESCE((IF(title = '', given_url, title)), given_url) as title`,
        ),
        'given_url as url',
        this.db.raw('UNIX_TIMESTAMP(time_added) as time_added'),
        'id as cursor',
        'it.tags',
        this.db.raw(`IF(status = 1, 'archive', 'unread') as status`),
      )
      .where('user_id', this.userId)
      .andWhere('id', '>=', from)
      .andWhere(function () {
        this.where('status', '=', 1).orWhere('status', '=', 0);
      })
      .orderBy('id', 'asc')
      .leftJoin(
        this.db('item_tags')
          .select(
            'item_id',
            this.db.raw(`GROUP_CONCAT(tag SEPARATOR '|') AS tags`),
          )
          .as('it')
          .where('user_id', this.userId)
          .groupBy('item_id'),
        function () {
          this.on('it.item_id', '=', 'list.item_id');
        },
      )
      .limit(size + 1);
    const entries: Array<ListExportEntry & { cursor: number }> = await query;
    return entries;
  }
  /**
   * Save a chunk of list data for export.
   * @param requestId ID for tracking the request
   * @param fromId cursor for pagination
   * @param size page size
   * @param part numeric part, for file naming
   */
  async exportListChunk(
    requestId: string,
    fromId: number,
    size: number,
    part: number,
  ) {
    Sentry.addBreadcrumb({ data: { cursor: fromId, part, requestId } });
    try {
      const entries = await this.fetchListData(fromId, size);
      // There's no data
      if (entries.length === 0) {
        if (part === 0) {
          serverLogger.info({
            message:
              'ListDataExportService - export complete, notifying user (no data)',
            requestId,
          });
          await this.notifyUser(this.encodedId, requestId);
        } else {
          serverLogger.warn('Export returned no results');
        }
      }
      // We're finished!
      else if (entries.length <= size) {
        await this.exportBucket.writeCsv(
          entries,
          `${this.partsPrefix}/part_${part.toString().padStart(6, '0')}`,
        );
        serverLogger.info({
          message: 'ListDataExportService - zipping files',
          requestId,
          prefix: this.partsPrefix,
          file: this.zipFileKey,
        });
        const zipResponse = await this.exportBucket.zipFilesByPrefix(
          this.partsPrefix,
          this.zipFileKey,
        );
        if (zipResponse != null) {
          const { Key: zipKey } = zipResponse;
          const signedUrl = await this.exportBucket.getSignedUrl(
            zipKey,
            config.listExport.signedUrlExpiry,
          );
          serverLogger.info({
            message: 'ListDataExportService - export complete, notifying user',
            requestId,
            zipKey,
          });
          await this.notifyUser(this.encodedId, requestId, signedUrl);
        } else {
          const errorMessage = 'Expected a zipfile but did not find any data';
          Sentry.captureException(errorMessage, {
            data: { requestId, fromId, part },
          });
          serverLogger.error({
            message: errorMessage,
            requestId,
            fromId,
            part,
          });
          throw new Error(errorMessage);
        }
      } else {
        // Will pull in greater than or equal to cursor
        const cursor = entries.splice(size)[0].cursor;
        await this.exportBucket.writeCsv(
          entries,
          `${this.partsPrefix}/part_${part.toString().padStart(6, '0')}`,
        );
        serverLogger.info({
          message: 'ListDataExportService - Requesting next chunk',
          requestId,
          cursor,
          part: part + 1,
        });
        await this.requestNextChunk(requestId, cursor, part + 1);
      }
    } catch (err) {
      serverLogger.error({
        message: 'Unhandled error occurred during export',
        errorData: err,
        cursor: fromId,
        part,
        requestId: requestId,
      });
      Sentry.captureException(err);
    }
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
      QueueUrl: config.aws.sqs.exportQueue.url,
    });
    await sqs.send(command);
    return;
  }
  // Emit an event to event bridge to notify user
  async notifyUser(encodedId: string, requestId: string, signedUrl?: string) {
    const payload = {
      encodedId,
      requestId,
      archiveUrl: signedUrl,
    };
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify(payload),
          Source: config.app.serviceName.toLowerCase(),
          DetailType: 'list-export-ready',
        },
      ],
    });
    try {
      await this.eventBridge.send(command);
    } catch (err) {
      serverLogger.error({
        message: 'Error sending list-export-ready event',
        errorData: err,
        payload,
      });
      Sentry.captureException(err, { data: { payload } });
      // Re-throw for calling function
      throw err;
    }
  }

  /**
   * Return the signedUrl of an unexpired export for a User
   * (if it exists, false otherwise)
   */
  async lastGoodExport(): Promise<string | false> {
    const exists = await this.exportBucket.objectExists(this.zipFileKey);
    if (exists) {
      return await this.exportBucket.getSignedUrl(
        this.zipFileKey,
        config.listExport.signedUrlExpiry,
        config.listExport.presignedIamUserCredentials,
      );
    } else {
      return false;
    }
  }
}
