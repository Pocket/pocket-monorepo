import { Connection, Edge } from '../shared/types';
import { SelectQueryBuilder } from 'kysely';
import { DB } from '.kysely/client/types';
import { ValidatedPagination } from '@pocket-tools/apollo-utils';

/**
 * Offset pagination with an interface that implements
 * the Relay cursor pagination specification, so clients
 * have a consistent experience with our cursor-based
 * pagination pattern (even when offset is more appropriate)
 */
export class OffsetPagination<TB extends keyof DB, O> {
  public static sentinel = '__pkt__';
  /**
   * Create a fake cursor from an offset value
   */
  public static encodeCursor(n: number): string {
    // Probably unnecessary, but give the "cursors" a little oomph
    const salt = (+new Date()).toString(36).slice(2);
    return Buffer.from(
      salt + OffsetPagination.sentinel + n.toString(),
    ).toString('base64');
  }
  /**
   * Decode cursor into offset value
   */
  public static decodeCursor(cursor: string | undefined): number | undefined {
    if (cursor == null) {
      return undefined;
    }
    const decodedFull = Buffer.from(cursor, 'base64').toString();
    return parseInt(decodedFull.split(OffsetPagination.sentinel)[1]);
  }
  /**
   * Paginate a query
   * @param pagination the pagination parameters
   * @param query a query builder -- the paginator will constrain
   * the result set returned by this query
   * @returns Paginated result set
   */
  public async page(
    pagination: ValidatedPagination,
    query: SelectQueryBuilder<DB, TB, O>,
  ): Promise<Connection<O>> {
    if (pagination.first) {
      const offset =
        pagination.after != null
          ? OffsetPagination.decodeCursor(pagination.after) + 1
          : 0;
      return await this.paginate(query, offset, pagination.first);
    } else if (pagination.last) {
      const decodedOffset = OffsetPagination.decodeCursor(pagination.before);
      // Adjust limit to ensure the correct page size when paginating backwards;
      // we don't want to go past whatever the original "cursor" (offset) value was,
      // which can happen if we reach the beginning of the set
      const limit = Math.min(pagination.last, decodedOffset ?? Infinity);
      // Subtract limit from the given offset to retrieve "previous" page
      const offset =
        decodedOffset != null
          ? Math.max(
              decodedOffset - pagination.last,
              0, // Don't go negative when subtracting limit from offset
            )
          : -1; // Special value to signify getting the last page (computed on totalCount)
      return await this.paginate(query, offset, limit);
    } else {
      // Default result for invalid inputs
      return {
        edges: [] as Edge<O>[],
        totalCount: 0,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: undefined,
          endCursor: undefined,
        },
      };
    }
  }
  private async paginate(
    query: SelectQueryBuilder<DB, TB, O>,
    givenOffset: number,
    limit: number,
  ): Promise<Connection<O>> {
    const totalCount = (
      await query
        .clearSelect()
        .select((eb) => eb.fn.countAll<number>().as('totalcount'))
        .executeTakeFirst()
    ).totalcount;
    // If offset is -1 (the default for 'last' pagination, recompute it based on count),
    // ensuring the offset is never negative
    const offset =
      givenOffset == -1 ? Math.max(totalCount - limit, 0) : givenOffset;
    // Attempt to overfetch by 1 to find out if there are more
    const qb = query.offset(offset).limit(limit + 1);
    const rows = await qb.execute();
    const hasNextPage = rows.length > limit;
    const hasPreviousPage = rows.length > 0 && offset > 0;
    if (hasNextPage) {
      // Remove the extra row
      rows.pop();
    }
    const edges = rows.map((row, index) => ({
      // Clients really shouldn't use this "cursor", but this is the
      // closest we could get...
      // As long as the data doesn't change it will act deterministically.
      // If the data changes before being paginated with one of these
      // 'cursors' it may not return expected results, as it's just an offset value
      cursor: OffsetPagination.encodeCursor(offset + index),
      node: row,
    }));
    const startCursor = edges.length ? edges[0].cursor : null;
    const endCursor = edges.length ? edges.slice(-1)[0].cursor : null;
    return {
      edges,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor,
        endCursor,
      },
      totalCount,
    };
  }
}
