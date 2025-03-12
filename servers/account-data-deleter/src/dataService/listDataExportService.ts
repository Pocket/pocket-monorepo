import type { Knex } from 'knex';
import { config } from '../config';
import path from 'path';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { AsyncDataExportService, S3Bucket } from '@pocket-tools/aws-utils';
import { sqs } from '../aws/sqs';

type ListExportEntry = {
  url: string;
  title: string;
  time_added: number; // seconds from epoch
  status: 'archive' | 'unread';
  tags: string; // concatenated array of tags, pipe-separated
  cursor: number;
};

/**
 * Export a User's list data.
 * Data will be exported in chunks and saved in s3, keyed under
 * the user's encodedId (e.g. <export-bucket>/<parts-prefix>/<encodedId>/part_0000.csv)
 * When all data has been exported, the individual CSVs will be compiled
 * into one zip archive, keyed with their encodedId
 * (e.g. <export-bucket>/<archive-prefix>/<encodedId/pocket.zip)
 */
export class ListDataExportService extends AsyncDataExportService<
  ListExportEntry,
  Omit<ListExportEntry, 'cursor'>
> {
  constructor(
    userId: number,
    encodedId: string,
    private db: Knex,
    exportBucket: S3Bucket,
    eventBridge: PocketEventBridgeClient,
  ) {
    super(
      { userId, encodedId },
      {
        bucket: exportBucket,
        partsPrefix: config.listExport.partsPrefix,
      },
      {
        workQueue: config.aws.sqs.listExportQueue.url,
        client: sqs,
      },
      {
        source: 'account-data-deleter',
        client: eventBridge,
      },
    );
  }

  get serviceName() {
    return 'list' as const;
  }

  fileKey(part: number) {
    return path.join(
      this.partsPrefix,
      `part_${part.toString().padStart(6, '0')}`,
    );
  }

  async formatExport(
    records: ListExportEntry[],
  ): Promise<Array<Omit<ListExportEntry, 'cursor'>>> {
    return records.map(({ cursor, ...entry }) => {
      return entry;
    });
  }

  async write(records: Omit<ListExportEntry, 'cursor'>[], fileKey: string) {
    await this.s3.bucket.writeCsv(records, fileKey);
  }

  /**
   * Fetch a page of data from a User's list, to build the export file
   * @param from cursor value to paginate from (inclusive, ascending)
   * @param size size of page
   * @returns Promise<Array<ListExportEntry & { cursor: number }>
   */
  async fetchData(
    from: number,
    size: number,
  ): Promise<Array<ListExportEntry & { cursor: number }>> {
    const query = this.db('list')
      .select(
        this.db.raw(
          `COALESCE((IF(title = '' || title = 'Problem loading page', given_url, title)), given_url) as title`,
        ),
        'given_url as url',
        this.db.raw('UNIX_TIMESTAMP(time_added) as time_added'),
        'id as cursor',
        'it.tags',
        this.db.raw(`IF(status = 1, 'archive', 'unread') as status`),
      )
      .where('user_id', this.user.userId)
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
          .where('user_id', this.user.userId)
          .groupBy('item_id'),
        function () {
          this.on('it.item_id', '=', 'list.item_id');
        },
      )
      .limit(size + 1);
    const entries: Array<ListExportEntry & { cursor: number }> = await query;
    return entries;
  }
}
