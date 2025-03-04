import type { Knex } from 'knex';
import { S3Bucket } from './s3Service';
import path from 'path';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { FileExportService } from './FileExportService';

export type AnnotationsExportEntry = {
  url: string;
  title: string;
  highlights: [{ quote: string; created_at: number }];
  cursor: number;
};

/**
 * Export a User's list data.
 * Data will be exported in chunks and saved in s3, keyed under
 * the user's encodedId (e.g. <export-bucket>/<parts-prefix>/<encodedId>/part_0000.csv)
 * When all data has been exported, the individual CSVs will be compiled
 * into one zip archive, keyed with their encodedId
 * TODO: add an abstract CsvExportService which this implements along with
 * ListDataExportService.
 * (e.g. <export-bucket>/<archive-prefix>/<encodedId/pocket.zip)
 */
export class AnnotationsDataExportService extends FileExportService<
  AnnotationsExportEntry,
  Omit<AnnotationsExportEntry, 'cursor'>
> {
  constructor(
    userId: number,
    encodedId: string,
    db: Knex,
    exportBucket: S3Bucket,
    eventBridge: PocketEventBridgeClient,
  ) {
    super(userId, encodedId, db, exportBucket, eventBridge);
  }

  get serviceName() {
    return 'annotations' as const;
  }

  fileKey(part: number): string {
    return path.join(
      this.partsPrefix,
      this.serviceName,
      `part_${part.toString().padStart(6, '0')}`,
    );
  }

  formatExport(
    records: AnnotationsExportEntry[],
  ): Array<Omit<AnnotationsExportEntry, 'cursor'>> {
    return records.map(({ cursor, ...entry }) => {
      return entry;
    });
  }

  async write(
    records: Omit<AnnotationsExportEntry, 'cursor'>[],
    fileKey: string,
  ) {
    await this.exportBucket.writeJson(records, fileKey);
  }

  /**
   * Fetch a page of data from a User's list, to build the export file
   * @param from cursor value to paginate from (inclusive, ascending)
   * @param size size of page
   * @returns Promise<Array<AnnotationsExportResult>>
   */
  async fetchData(
    from: number,
    size: number,
  ): Promise<Array<AnnotationsExportEntry>> {
    const query = this.db
      .with('cte', (qb) => {
        // CTE to get the subset of the list for which we want to export annotations
        // (want to maintain annotations for same url in the same file, and provide more
        // useful metadata in the annotations export files)
        qb.from('list')
          .select(
            this.db.raw(`COALESCE(NULLIF(title, ''), given_url) AS title`),
            'given_url as url',
            'id as cursor',
            'item_id',
          )
          .where('user_id', this.userId)
          .andWhere('id', '>=', from)
          .andWhere(function () {
            this.where('status', '=', 1).orWhere('status', '=', 0);
          })
          .orderBy('id', 'asc')
          .limit(size + 1);
      })
      .select(
        'cte.cursor',
        this.db.raw('ANY_VALUE(cte.url) AS url'),
        this.db.raw('ANY_VALUE(cte.title) AS title'),
        this.db.raw('JSON_ARRAYAGG(ua.highlights) AS highlights'),
      )
      .from('cte')
      .rightJoin(
        this.db('user_annotations')
          .select(
            this.db.raw(
              `JSON_OBJECT('quote', quote, 'created_at', UNIX_TIMESTAMP(created_at)) AS highlights`,
            ),
            'item_id',
          )
          .as('ua')
          .where('user_id', this.userId)
          .andWhere('status', 1),
        function () {
          this.on('ua.item_id', '=', 'cte.item_id');
        },
      )
      .whereNotNull('cte.item_id') // removes annotations for deleted/hidden items
      .groupBy('cte.cursor');
    const entries: Array<AnnotationsExportEntry> = await query;
    return entries;
  }
}
