import { Knex } from 'knex';
import { IContext } from '../server/context';
import {
  SavedItemStatus,
  SavedItem,
  SavedItemsFilter,
  SavedItemsSort,
  SavedItemsContentType,
  Pagination,
  SavedItemConnection,
} from '../types';
import * as tag from '../models/tag';
import { mysqlTimeString } from './utils';
import config from '../config';
import { PaginationInput, UserInputError } from '@pocket-tools/apollo-utils';

interface ListEntity {
  user_id?: number;
  item_id?: number;
  resolved_id?: number;
  given_url?: string;
  title?: string;
  time_added?: number;
  time_updated?: number;
  time_read?: number;
  time_favorited?: number;
  status?: number;
  favorite?: boolean;
}

const statusMap = {
  [SavedItemStatus.UNREAD]: 'UNREAD',
  [SavedItemStatus.ARCHIVED]: 'ARCHIVED',
  [SavedItemStatus.DELETED]: 'DELETED',
  [SavedItemStatus.HIDDEN]: 'HIDDEN',
};

type SavedItemResult = Omit<SavedItem, 'item' | 'tags'>;

class Sort {
  public readonly order;
  public readonly column;

  constructor(sort: SavedItemsSort) {
    this.order = sort?.sortOrder.toLowerCase() ?? 'desc';
    this.column = sort?.sortBy ?? 'CREATED_AT';
  }

  get opposite() {
    return this.order === 'desc' ? 'asc' : 'desc';
  }
}

/**
 * A read-only data service for retrieving `SavedItems`
 * in a User's list, optionally with filters/sort/pagination.
 * This duplicates some behavior from `SavedItemsDataService`,
 * and is separated simply for clarity, since this is a significant
 * refactor. This is *just* for fetching paginated items.
 * All this is going to go away when we migrate away from the legacy
 * data storage anyway.
 */
export class ListPaginationService {
  private static LIST_TEMP_TABLE = 'temp_getlist_clientapi';
  private static HIGHLIGHTS_TEMP_TABLE = 'temp_getlist_clientapi_hl';
  private static TAGS_TEMP_TABLE = 'temp_getlist_clientapi_tags';

  // List of temporary tables that are created to fetch saved items
  private static TEMP_TABLES = [
    ListPaginationService.LIST_TEMP_TABLE,
    ListPaginationService.HIGHLIGHTS_TEMP_TABLE,
    ListPaginationService.TAGS_TEMP_TABLE,
  ];

  // Maps sortBy argument to the relevant db column
  public dbSortByMap = {
    CREATED_AT: 'time_added',
    UPDATED_AT: 'time_updated',
    FAVORITED_AT: 'time_favorited',
    ARCHIVED_AT: 'time_read',
  };

  // Maps sortBy argument to the SavedItem graphql field
  private nodeSortByMap = {
    CREATED_AT: '_createdAt',
    UPDATED_AT: '_updatedAt',
    FAVORITED_AT: 'favoritedAt',
    ARCHIVED_AT: 'archivedAt',
  };

  constructor(private readonly context: IContext) {}

  /**
   * Transformer from DB result to GraphQL Schema
   * @param entity ListEntity
   */
  private static toGraphql(entity: ListEntity[]): SavedItemResult[];
  private static toGraphql(entity: ListEntity): SavedItemResult;
  private static toGraphql(
    entity: ListEntity | ListEntity[],
  ): SavedItemResult | SavedItemResult[] {
    if (Array.isArray(entity)) {
      return entity.map((row) => ListPaginationService._toGraphql(row));
    } else {
      return ListPaginationService._toGraphql(entity);
    }
  }

  private static _toGraphql(
    entity: ListEntity,
  ): Omit<SavedItem, 'item' | 'tags'> {
    return {
      url: entity.given_url,
      id: entity.item_id.toString(),
      resolvedId: entity.resolved_id.toString(),
      title: entity.title,
      isFavorite: entity.favorite,
      favoritedAt: entity.time_favorited > 0 ? entity.time_favorited : null,
      status: statusMap[entity.status],
      isArchived: entity.status === SavedItemStatus.ARCHIVED,
      archivedAt: entity.time_read > 0 ? entity.time_read : null,
      _createdAt: entity.time_added,
      _updatedAt: entity.time_updated,
      _deletedAt:
        entity.status === SavedItemStatus.DELETED ? entity.time_updated : null,
    };
  }

  /**
   * Utility method to create the list temp table within a session
   * @param dbClient Open knex object
   * @returns Knex.Raw -- await this to create the table within the connection
   */
  private listTempTableQuery = (dbClient: Knex, connection: any): Knex.Raw =>
    dbClient
      .raw(
        `CREATE TEMPORARY TABLE \`${ListPaginationService.LIST_TEMP_TABLE}\` ` +
          '(' +
          '`seq` int NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
          '`item_id` int(10) unsigned NOT NULL, ' +
          '`resolved_id` int(10) unsigned NOT NULL, ' +
          /*
           * Setting VARCHAR length for given_url to 5,000. This is a hack to get it
           * reasonably high to prevent url from getting truncated since the
           * corresponding column in the db has a TEXT data type, and mysql
           * temporary tables do not support BLOB/TEXT
           */
          '`given_url` varchar(5000) COLLATE utf8_unicode_ci NOT NULL, ' +
          '`title` varchar(75) COLLATE utf8_unicode_ci NOT NULL, ' +
          '`favorite` tinyint(3) unsigned NOT NULL, ' +
          '`status` tinyint(3) unsigned NOT NULL, ' +
          '`time_added` int(10), ' +
          '`time_updated` int(10), ' +
          '`time_read` int(10), ' +
          '`time_favorited` int(10) ' +
          ') ENGINE = MEMORY',
      )
      .connection(connection);

  /**
   * Utility method to create the highlights temp table within a session
   * @param dbClient Knex query object
   * @param connection The db connection session to use
   * @returns Knex.Raw -- await this to create the table within a session
   */
  private hlTempTableQuery = (dbClient: Knex, connection: any) =>
    dbClient
      .raw(
        `CREATE TEMPORARY TABLE \`${ListPaginationService.HIGHLIGHTS_TEMP_TABLE}\` ` +
          '(' +
          '`item_id` int(10) unsigned NOT NULL PRIMARY KEY' +
          ') ENGINE = MEMORY',
      )
      .connection(connection);

  /**
   * Utility method to create the tags temp table within a session
   * @param dbClient Knex query object
   * @param connection The db connection session to use
   * @returns Knex.Raw -- await this to create the table within a session
   */
  private tagsTempQuery = (dbClient: Knex, connection: any) =>
    dbClient
      .raw(
        `CREATE TEMPORARY TABLE \`${ListPaginationService.TAGS_TEMP_TABLE}\` ` +
          '(' +
          '`item_id` int(10) unsigned NOT NULL PRIMARY KEY' +
          ') ENGINE = MEMORY',
      )
      .connection(connection);

  /**
   * Returns a promise to clean up all temp tables created using `this.createTempTable`
   * within a session
   * @param dbClient Knex query object
   * @param connection The db connection session to use
   * @returns Promise to delete all tables created; await this to perform deletion
   */
  private dropTempTables(dbClient: Knex, connection: any): any {
    return Promise.all(
      ListPaginationService.TEMP_TABLES.map((tableName) =>
        dbClient
          .raw(`DROP TEMPORARY TABLE IF EXISTS \`${tableName}\``)
          .connection(connection),
      ),
    );
  }

  /**
   * Private function to determine which pagination methods to call, and set up
   * some shared temp table logic.
   */
  private async paginatedResult(
    query: Knex.QueryBuilder,
    dbClient: Knex,
    pagination: PaginationInput,
    sort: SavedItemsSort,
    connection: any,
  ) {
    const queryBuilder = query.select(
      'list.item_id',
      'list.resolved_id',
      'list.given_url',
      'list.title',
      'list.favorite',
      'list.status',
      dbClient.raw('UNIX_TIMESTAMP(list.time_added) as time_added'),
      dbClient.raw('UNIX_TIMESTAMP(list.time_updated) AS time_updated'),
      dbClient.raw('UNIX_TIMESTAMP(list.time_read) AS time_read'),
      dbClient.raw('UNIX_TIMESTAMP(list.time_favorited) AS time_favorited'),
    );
    // needs to be same order as above
    const insertStatement = `INSERT INTO \`${ListPaginationService.LIST_TEMP_TABLE}\` (item_id, resolved_id, given_url, title, favorite, status, time_added, time_updated, time_read, time_favorited) `;
    const cursor = pagination.after ?? pagination.before ?? null;
    if (cursor) {
      return this.pageAfterorBefore(
        dbClient,
        queryBuilder,
        insertStatement,
        cursor,
        pagination,
        sort,
        connection,
      );
    } else {
      return this.pageFirstLast(
        dbClient,
        queryBuilder,
        insertStatement,
        sort,
        pagination,
        connection,
      );
    }
  }

  /**
   * Handle first/last pagination.
   */
  private async pageFirstLast(
    dbClient: Knex,
    query: Knex.QueryBuilder,
    insertStatement: string,
    sort: SavedItemsSort,
    pagination: PaginationInput,
    connection: any,
  ) {
    const pageSize = pagination.first ?? pagination.last;
    const sortOrder = new Sort(sort);
    let order;
    if (pagination.first) {
      order = sortOrder.order;
    } else {
      order = sortOrder.opposite;
    }
    const sortColumn = this.dbSortByMap[sortOrder.column];
    const queryString = query
      .clone()
      .orderBy([
        { column: `list.${sortColumn}`, order: order },
        { column: 'list.item_id' },
      ])
      .limit(pageSize + 1)
      .toString();
    await dbClient
      .raw(`${insertStatement} ${queryString}`)
      .connection(connection);
    const returnQuery = dbClient(
      `${ListPaginationService.LIST_TEMP_TABLE}`,
    ).select();
    if (pagination.last) {
      // Need to reorder for last
      returnQuery.orderBy([
        { column: `${sortColumn}`, order: sortOrder.order },
        { column: 'item_id' },
      ]);
    }
    return returnQuery.connection(connection);
  }

  /**
   * Handle before/after pagination.
   * If the provided cursor does not exist, throws UserInputError.
   */
  private async pageAfterorBefore(
    dbClient: Knex,
    baseQuery: Knex.QueryBuilder,
    insertStatement: string,
    cursor: string,
    pagination: PaginationInput,
    sort: SavedItemsSort,
    connection: any,
  ) {
    const pageSize = pagination.first ?? pagination.last;
    // Since we don't have a unique sequential column for cursor-based pagination
    // We have to get the old cursor element + any colliding keys
    // Set a high (default of 5000 from the web repo) on this, but hopefully
    // collisions on timestamp fields are unusual enough that it will be much
    // less in practice
    const [itemId, timeStr] = ListPaginationService.decodeCursor(cursor);
    const timeCursor = timeStr
      ? mysqlTimeString(new Date(parseInt(timeStr) * 1000), config.database.tz)
      : null;
    // The trick to before pagination is to do after pagination with opposite sort
    // then reverse the ordering before returning result
    const sortOrder = new Sort(sort);
    let order;
    if (pagination.first) {
      order = sortOrder.order;
    } else {
      order = sortOrder.opposite;
    }
    const sortColumn = this.dbSortByMap[sortOrder.column];
    // Add the sort to the filter query
    baseQuery.orderBy([
      { column: `list.${sortColumn}`, order: order },
      { column: 'list.item_id' },
    ]);
    // Get the old cursor element + any colliding keys
    const initialCursorQuery = baseQuery
      .clone()
      .andWhere(sortColumn, timeCursor)
      .limit(5000)
      .toString();
    await dbClient
      .raw(`${insertStatement} ${initialCursorQuery}`)
      .connection(connection);

    const listTempTable = ListPaginationService.LIST_TEMP_TABLE;
    // Get location (index) of previous cursor
    const prevCursorSeq = (
      await dbClient(listTempTable)
        .where('item_id', itemId)
        .pluck('seq')
        .connection(connection)
    )[0];
    // Remove anything prior and up to the cursor (inclusive)
    // Note that the reverse ordering from 'before' pagination
    // means that we don't have to change the direction of our removal
    if (prevCursorSeq == null) {
      throw new UserInputError('Cursor not found.');
    }
    await dbClient(listTempTable)
      .where('seq', '<=', prevCursorSeq)
      .del()
      .connection(connection);
    // Compute how many we have in the table; if there are a lot of
    // collisions we may not even need to fetch more
    const currCount = (await dbClient(listTempTable)
      .count('* as count')
      .first()
      .connection(connection)
      .then((_) => _?.count ?? 0)) as number;
    const limit = pageSize + 1 - currCount;
    if (limit > 0) {
      // Now we insert more with a limit
      // If the timestamp is sorted by descending, the 'next' page is < time cursor
      // If the timestamp is sorted by ascending, the 'next' page is > time cursor
      const restOfQuery = baseQuery
        .clone()
        .andWhere(sortColumn, order === 'desc' ? '<' : '>', timeCursor)
        .limit(limit)
        .toString();
      await dbClient
        .raw(`${insertStatement} ${restOfQuery}`)
        .connection(connection);
    }
    const returnQuery = dbClient(listTempTable)
      .select()
      .limit(pageSize + 1);
    if (pagination.last) {
      returnQuery.orderBy([
        { column: sortColumn, order: sortOrder.order },
        { column: 'item_id' },
      ]);
    }
    return returnQuery.connection(connection);
  }

  /**
   * Decode the pagination cursor
   * @param cursor cursor (_*_ separated string of itemId and cursor value)
   * @returns [itemId, cursorValue]
   */
  public static decodeCursor(cursor: string) {
    const [id, val] = Buffer.from(cursor, 'base64')
      .toString('utf8')
      .split('_*_');
    return [id, val === 'null' || val === 'undefined' ? null : val];
  }

  /**
   * Encode the pagination cursor
   * @param itemId The itemId
   * @param epoch The value of the timestamp field used for cursor, in seconds since epoch,
   * or null/undefined if the value is null in the database (bad cursor!)
   * @returns
   */
  private encodeCursor(itemId: number | string, epoch: number | null) {
    return Buffer.from(`${itemId}_*_${epoch}`).toString('base64');
  }

  /**
   * Build a filter query. If filtering by highlights or tags, will create
   * temporary tables as a side effect, which is why this needs to be awaited.
   */
  private async buildFilterQuery(
    baseQuery: any,
    dbClient: Knex,
    filter: SavedItemsFilter,
    connection: any,
  ): Promise<any> {
    // The base query will always have a 'where' statement selecting
    // the user ID, so use andWhere for all additional methods
    if (filter.updatedSince != null) {
      baseQuery.andWhere(
        'time_updated',
        '>',
        mysqlTimeString(
          new Date(filter.updatedSince * 1000),
          config.database.tz,
        ),
      );
    }
    if (filter.isFavorite != null) {
      baseQuery.andWhere('favorite', +filter.isFavorite);
    }
    if (filter.isArchived != null) {
      if (filter.isArchived) {
        baseQuery.andWhere('status', 1);
      } else {
        baseQuery.andWhere('status', '!=', 1);
      }
    }
    if (filter.status != null) {
      baseQuery.andWhere('status', SavedItemStatus[filter.status]);
    }
    if (filter.statuses != null) {
      const statuses = filter.statuses.map((status) => SavedItemStatus[status]);
      baseQuery.andWhere((builder) => {
        builder.whereIn('status', statuses);
      });
    }
    if (filter.isHighlighted != null) {
      await this.isHighlightedFilter(
        baseQuery,
        dbClient,
        filter.isHighlighted,
        connection,
      );
    }
    if (filter.contentType != null) {
      this.contentTypeFilter(baseQuery, filter.contentType);
    }
    // Tags has to go last due to select distinct
    if (filter.tagNames != null && filter.tagNames.length > 0) {
      const cleanTags = filter.tagNames.map(tag.sanitizeTagName);
      await this.tagNameFilter(baseQuery, dbClient, cleanTags, connection);
    }
  }

  /**
   * Filter by highlighted/not highlighted. Creates a temporary table as
   * a side effect to optimize join.
   */
  private async isHighlightedFilter(
    baseQuery: Knex,
    dbClient: Knex,
    isHighlighted: boolean,
    connection: any,
  ) {
    // Don't want to do aggregate functions inside our pagination query,
    // So use a temp table and simplify, so it's just a join
    await this.hlTempTableQuery(dbClient, connection);
    const highlightsTempTable = ListPaginationService.HIGHLIGHTS_TEMP_TABLE;
    const insertStatement = `INSERT INTO \`${highlightsTempTable}\` (item_id) `;
    const highlightsQuery = dbClient('user_annotations')
      .select(dbClient.raw(`distinct item_id as item_id`))
      .where('user_id', this.context.userId)
      .andWhere('status', 1)
      .toString();
    await dbClient
      .raw(`${insertStatement} ${highlightsQuery}`)
      .connection(connection);
    if (isHighlighted) {
      baseQuery.innerJoin(
        highlightsTempTable,
        'list.item_id',
        `${highlightsTempTable}.item_id`,
      );
    } else {
      baseQuery
        .leftJoin(
          highlightsTempTable,
          'list.item_id',
          `${highlightsTempTable}.item_id`,
        )
        .andWhere(dbClient.raw(`\`${highlightsTempTable}\`.item_id is null`));
    }
  }

  /**
   * Filter by specific tags, untagged items, or a combination of these.
   * Creates a temporary table as a side effect to optimize join.
   */
  private async tagNameFilter(
    baseQuery: Knex.QueryBuilder,
    dbClient: Knex,
    tagNames: string[],
    connection: any,
  ) {
    if (tagNames.length === 0) {
      return baseQuery;
    }
    // Can't do a straight inner join since we may have "untagged" items
    // that we need to find
    const untaggedIndex = tagNames.indexOf('_untagged_');
    await this.tagsTempQuery(dbClient, connection);
    const tagsTempTable = ListPaginationService.TAGS_TEMP_TABLE;
    const insertStatement = `INSERT INTO \`${tagsTempTable}\` (item_id) `;
    const tagsSubQuery = dbClient('item_tags')
      .select('tag', 'item_id', 'user_id')
      .where('user_id', this.context.userId);
    const listTags = baseQuery
      .clone()
      .leftJoin(tagsSubQuery.as('t'), {
        'list.item_id': 't.item_id',
        'list.user_id': 't.user_id',
      })
      .select('t.tag', 'list.item_id');
    if (untaggedIndex > -1) {
      tagNames.splice(untaggedIndex, 1);
      if (tagNames.length) {
        listTags.andWhere((builder) => {
          // untagged items plus an item with specific tag(s)
          builder.andWhere('tag', 'in', tagNames).orWhereNull('tag');
        });
      } else {
        // untagged items only
        listTags.whereNull('tag');
      }
    } else {
      // specific tagged items
      listTags.andWhere('tag', 'in', tagNames);
    }
    const insertQuery = dbClient
      .select(dbClient.raw(`distinct lt.item_id as item_id`))
      .from(listTags.as('lt'))
      .toString();
    await dbClient
      .raw(`${insertStatement} ${insertQuery}`)
      .connection(connection);
    baseQuery.join(tagsTempTable, 'list.item_id', `${tagsTempTable}.item_id`);
  }

  /**
   * Add content type filter via cross-db join to base query.
   */
  private contentTypeFilter(
    baseQuery: Knex,
    contentType: SavedItemsContentType,
  ): Knex {
    baseQuery.join(
      `readitla_b.items_extended`,
      'list.resolved_id',
      'readitla_b.items_extended.extended_item_id',
    );

    switch (contentType) {
      // Deprecated
      case 'VIDEO':
        baseQuery.where('readitla_b.items_extended.video', 1);
        break;
      // Deprecated
      case 'ARTICLE':
        baseQuery.where('readitla_b.items_extended.is_article', 1);
        break;
      case 'IS_EXTERNAL':
        // Only query for items that have "is_article" 0, and "video" and "image" not equal to 2
        // The understanding is that this implies that the item was truly not parsed
        baseQuery
          .where('readitla_b.items_extended.is_article', 0)
          .andWhere('readitla_b.items_extended.video', '!=', 2)
          .andWhere('readitla_b.items_extended.image', '!=', 2);
        break;
      case 'IS_READABLE':
        baseQuery.where('readitla_b.items_extended.is_article', 1);
        break;
      case 'HAS_VIDEO':
        baseQuery.where('readitla_b.items_extended.video', 1);
        break;
      case 'IS_IMAGE':
        baseQuery.where('readitla_b.items_extended.image', 2);
        break;
      case 'IS_VIDEO':
        baseQuery.where('readitla_b.items_extended.video', 2);
        break;
    }

    return baseQuery;
  }

  /**
   * Get a page of SavedItems
   * @param filter filter rules for SavedItems
   * @param sort how the SavedItems should be sorted;
   * this has pagination implications
   * @param pagination how the SavedItems should be paginated
   * @param savedItemIds optionally, provide a list of savedItem IDs
   * to limit the responses to. Used when resolving SavedItems on tags,
   * since there may be many SavedItems associated to a single tag.
   * @returns Promise<SavedItemConnection>
   */
  public async getSavedItems(
    filter: SavedItemsFilter,
    sort: SavedItemsSort,
    pagination: Pagination,
    savedItemIds?: string[],
  ): Promise<SavedItemConnection> {
    if (pagination == null) {
      pagination = { first: config.pagination.defaultPageSize };
    }

    const connection = await this.context.dbClient.client.acquireConnection();

    //Define these outside the try statement to be used later
    let totalCount;
    let pageResult;
    try {
      // Drop temp tables if exists.
      await this.dropTempTables(this.context.dbClient, connection);

      await this.listTempTableQuery(this.context.dbClient, connection);
      const baseQuery = this.context
        .dbClient('list')
        .where('list.user_id', this.context.userId);
      if (savedItemIds?.length) {
        baseQuery.whereIn('list.item_id', savedItemIds);
      }
      if (filter != null) {
        await this.buildFilterQuery(
          baseQuery,
          this.context.dbClient,
          filter,
          connection,
        );
      }
      totalCount = (await this.context.dbClient
        .count('* as count')
        .from(baseQuery.clone().select('list.*').limit(5000).as('countQuery'))
        .first()
        .connection(connection)
        .then((_) => _?.count ?? 0)) as number;
      pageResult = await this.paginatedResult(
        baseQuery as any,
        this.context.dbClient,
        pagination,
        sort,
        connection,
      );
    } finally {
      //ensure we always release the connection back to the rest of the pool to play with its friends
      await this.context.dbClient.client.releaseConnection(connection);
    }

    const pageInfo: any = this.hydratePageInfo(pageResult, pagination);
    let nodes: SavedItemResult[];
    if (pagination.first) {
      nodes = ListPaginationService.toGraphql(
        pageResult
          // strip off sentinel row; this can be unconditional
          .slice(0, pagination.first),
      );
    } else {
      // conditionally strip off sentinel row if it exists (hasPreviousPage)
      const startIx = pageInfo.hasPreviousPage ? 1 : 0;
      nodes = ListPaginationService.toGraphql(
        pageResult.slice(startIx, pagination.last + startIx),
      );
    }
    const sortColumn = this.nodeSortByMap[sort?.sortBy ?? 'CREATED_AT'];
    const edges = nodes.map((node) => {
      return {
        node: node as SavedItem,
        cursor: this.encodeCursor(node.id, node[sortColumn]),
      };
    });
    if (edges.length) {
      pageInfo['startCursor'] = edges[0].cursor;
      pageInfo['endCursor'] = edges[edges.length - 1].cursor;
    }
    return {
      edges,
      pageInfo,
      totalCount: totalCount,
    };
  }

  public hydratePageInfo(
    pagedResult: ListEntity[],
    pagination: PaginationInput,
  ) {
    const pageInfo = { startCursor: null, endCursor: null };
    if (pagination.first) {
      pageInfo['hasNextPage'] = pagedResult.length > pagination.first;
      if (pagination.after) {
        // 'after' isn't inclusive, so there is always a previous page
        pageInfo['hasPreviousPage'] = true;
      } else {
        // first result not after cursor means no before
        pageInfo['hasPreviousPage'] = false;
      }
    } else if (pagination.last) {
      pageInfo['hasPreviousPage'] = pagedResult.length > pagination.last;
      if (pagination.before) {
        // 'before' isn't inclusive, so there is always a next page
        pageInfo['hasNextPage'] = true;
      } else {
        // last result not after cursor means no after
        pageInfo['hasNextPage'] = false;
      }
    }
    return pageInfo;
  }
}
