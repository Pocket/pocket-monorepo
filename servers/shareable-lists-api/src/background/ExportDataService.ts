import { Kysely, Selectable } from 'kysely';
import { DB, List, ListItem } from '.kysely/client/types';
import path from 'path';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { S3Bucket, AsyncDataExportService } from '@pocket-tools/aws-utils';
import { sqs } from '../aws/sqs';
import config from '../config';
import slugify from 'slugify';

type ListRecord = Pick<
  Selectable<List>,
  'description' | 'slug' | 'title' | 'createdAt'
> & {
  cursor: number;
};

type ListItemExport = {
  url: string;
  title: string;
  excerpt: string;
  note?: string;
};

export type ListExport = Omit<ListRecord, 'cursor' | 'createdAt'> & {
  createdAt: string;
  items: ListItemExport[];
};

export class ExportDataService extends AsyncDataExportService<
  ListRecord,
  ListExport
> {
  constructor(
    userId: number,
    encodedId: string,
    private readonly db: Kysely<DB>,
    exportBucket: S3Bucket,
    eventBridge: PocketEventBridgeClient,
  ) {
    super(
      { userId, encodedId },
      {
        bucket: exportBucket,
        partsPrefix: config.export.bucket.partsPrefix,
      },
      {
        workQueue: config.export.workQueue.url,
        client: sqs,
      },
      {
        source: 'shareable-lists',
        client: eventBridge,
      },
    );
  }
  get serviceName() {
    return 'shareable-lists' as const;
  }

  fileKey(slug: string | number): string {
    return path.join(this.partsPrefix, 'collections', slug.toString());
  }

  /**
   * Get a page of lists
   * @param fromId the listId to start with as the cursor
   * @param size the max number of lists to pull
   * @returns ListExportEntry[]
   */
  async fetchData(fromId: number, size: number): Promise<Array<ListRecord>> {
    return await this.db
      .selectFrom('List')
      .select(['description', 'slug', 'title', 'id as cursor', 'createdAt'])
      .where('userId', '=', this.user.userId)
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
  private async getListItems(
    listId: number,
  ): Promise<
    Array<Pick<Selectable<ListItem>, 'url' | 'title' | 'excerpt' | 'note'>>
  > {
    return await this.db
      .selectFrom('ListItem')
      .select(['url', 'title', 'excerpt', 'note'])
      .where('listId', '=', listId)
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')
      .execute();
  }
  /**
   * Hydrate the shareable list data with their entries
   */
  async formatExport(entries: ListRecord[]): Promise<ListExport[]> {
    const formatted: ListExport[] = [];
    for await (const list of entries) {
      const items = await this.getListItems(list.cursor);
      formatted.push({
        slug: list.slug ?? slugify(list.title, config.slugify),
        title: list.title,
        description: list.description,
        createdAt: list.createdAt.toISOString(),
        items,
      });
    }
    return formatted;
  }

  /**
   * Write shareable lists in separate JSON files
   * (one file per shareable list)
   */
  async write(lists: ListExport[], _: string) {
    for await (const list of lists) {
      await this.s3.bucket.writeJson(list, this.fileKey(list.slug));
    }
  }
}
