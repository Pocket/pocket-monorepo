import { Knex } from 'knex';
import { knexPaginator as paginate } from '@pocket-tools/apollo-cursor-pagination';
import {
  PaginationInput,
  SavedItemSearchResultConnection,
  SavedItemSearchResultPage,
  SearchFilterInput,
  SearchItemsContentType,
  UserSearchSavedItemsArgs,
  UserSearchSavedItemsByOffsetArgs,
} from '../__generated__/types';
import { IContext } from '../server/context';
import { validatePagination as externalValidatePagination } from '@pocket-tools/apollo-utils';
import { config } from '../config';
import { getCleanedupDomainName } from './elasticsearch/elasticsearchSearch';
import { SavedItemStatus } from '../types';

export class SavedItemDataService {
  private db: Knex;
  private readonly userId: string;

  constructor(context: IContext) {
    this.db = context.knexDbClient;
    this.userId = context.userId;
  }

  /**
   * Validates the pagination object to restrict how many records
   * can be fetched per query
   * @param pagination
   * @private
   */
  public static validatePagination(pagination: PaginationInput) {
    return externalValidatePagination(
      pagination,
      config.pagination.defaultPageSize,
      config.pagination.maxPageSize,
    );
  }

  /**
   * Build filter statments from SavedItemsFilter for pagination
   * The database entities don't nicely map onto the GraphQL objects
   * so this very explicit way may be the most clear and maintainable.
   * @param baseQuery the base query for selecting a user's list
   * @param filter a SavedItemsFilter object containing instructions for filtering
   * a user's list
   */
  private static buildFilterQuery(
    baseQuery: Knex,
    filter: SearchFilterInput,
  ): Knex {
    if (filter.isFavorite != null) {
      baseQuery.andWhere('readitla_ril-tmp.list.favorite', filter.isFavorite);
    }

    if (filter.status != null) {
      baseQuery.andWhere(
        'readitla_ril-tmp.list.status',
        SavedItemStatus[filter.status],
      );
    }

    if (filter.contentType != null) {
      SavedItemDataService.contentTypeFilter(baseQuery, filter.contentType);
    }
    if (filter.domain != null) {
      const cleanDomain = getCleanedupDomainName(filter.domain);
      baseQuery.andWhere((builder) => {
        builder
          .where('readitla_ril-tmp.list.given_url', 'LIKE', `%${cleanDomain}%`)
          .orWhere(
            'readitla_b.items_extended.resolved_url',
            'LIKE',
            `%${cleanDomain}%`,
          );
      });
    }
    return baseQuery;
  }

  private static contentTypeFilter(
    baseQuery: Knex,
    contentType: SearchItemsContentType,
  ): Knex {
    if (contentType == 'VIDEO') {
      baseQuery.where('readitla_b.items_extended.video', 1);
    } else {
      baseQuery.where('readitla_b.items_extended.is_article', 1);
    }
    return baseQuery;
  }

  /**
   * Helper function to build repeated queries, for DRY savedItem and savedItems fetches.
   * Will eventually be extended for building filter, sorts, etc. for different pagination, etc.
   * For now just to reuse the same query and reduce testing burden :)
   *
   * Note: we are filtering out deleted items
   *
   * This utilizes a cross-db join. If you follow this with any other `where` statements,
   * it is recommended to fully specify the `db.table.field`. We are seeing query compiling
   * errors without a clear root cause. This is being investigated as a potential suspect,
   * and it doesn't hurt to be explicit either. More investigation details can be found in
   * the ticket associated with this commit.
   */
  public buildQuery(term: string): any {
    return this.db('list')
      .select(
        'readitla_ril-tmp.list.given_url AS url',
        'readitla_ril-tmp.list.time_favorited', // for pagination sort
        'readitla_ril-tmp.list.time_added AS time_added', // for pagination sort
        'readitla_ril-tmp.list.item_id AS id',
        'readitla_ril-tmp.list.time_updated', // for pagination sort
        'readitla_b.items_extended.lang',
        'readitla_b.items_extended.word_count AS word_count',
      )
      .join(
        `readitla_b.items_extended`,
        'readitla_ril-tmp.list.resolved_id',
        'readitla_b.items_extended.extended_item_id',
      )
      .whereNot('readitla_ril-tmp.list.status', SavedItemStatus.DELETED)
      .where((builder) => {
        builder
          .where('readitla_ril-tmp.list.title', 'like', `%${term}%`)
          .orWhere('readitla_ril-tmp.list.given_url', 'like', `%${term}%`)
          .orWhere(
            'readitla_b.items_extended.resolved_url',
            'like',
            `%${term}%`,
          )
          .orWhereRaw(`LOWER(readitla_b.items_extended.title) LIKE ?`, [
            `%${term}%`,
          ]);
      });
  }

  /**
   * Search for a term in the title, given_url, or resolved_url fields
   * of a user's saves, with offset pagination.
   * Returns a page of results.
   * @param term search term
   * @param filter can be filtered by status, favorite and content type
   * @param sort sort field and sort direction
   * @param pagination instructions for how to paginate the data
   */
  public async searchSavedItemsByOffset(
    params: UserSearchSavedItemsByOffsetArgs,
  ): Promise<SavedItemSearchResultPage> {
    const defaultPagination = {
      offset: 0,
      limit: config.pagination.defaultPageSize,
    };
    const pageInput = {
      ...defaultPagination,
      ...(params.pagination ?? {}),
    };
    const sortOrder = params.sort ? params.sort.sortOrder : 'DESC';
    const sortColumn =
      params.sort?.sortBy == `TIME_TO_READ` ? `word_count` : 'time_added';
    const term = params.term.toLowerCase();
    let baseQuery = this.buildQuery(term).andWhere(
      'readitla_ril-tmp.list.user_id',
      this.userId,
    );
    if (params.filter != null) {
      baseQuery = SavedItemDataService.buildFilterQuery(
        baseQuery,
        params.filter,
      );
    }
    // Pagination requires a stable sort,
    // item_id sort is to resolve ties with stable sort (e.g. null sort field)
    baseQuery.orderBy(sortColumn, sortOrder.toLowerCase(), 'item_id', 'asc');
    const totalcount = (await this.db
      .count('* as count')
      .from(baseQuery.clone().limit(5000).as('countQuery'))
      .first()
      .then((_) => _?.count ?? 0)) as number;
    const page =
      (await baseQuery.limit(pageInput.limit).offset(pageInput.offset)) ?? [];
    const entries = page.map((entry) => ({ savedItem: entry }));
    return {
      entries,
      totalCount: totalcount,
      ...pageInput,
    };
  }

  /**
   * Fetch all SavedItems in a User's list
   * @param term search term
   * @param filter can be filtered by status, favorite and content type
   * @param sort sort field and sort direction
   * @param pagination: instructions for how to paginate the data
   */
  public async searchSavedItems(
    params: UserSearchSavedItemsArgs,
  ): Promise<SavedItemSearchResultConnection> {
    params.pagination = SavedItemDataService.validatePagination(
      params.pagination,
    );

    const sortOrder = params.sort ? params.sort.sortOrder : 'DESC';
    const sortColumn =
      params.sort?.sortBy == `TIME_TO_READ` ? `word_count` : 'time_added';
    const term = params.term.toLowerCase();
    let baseQuery = this.buildQuery(term).andWhere(
      'readitla_ril-tmp.list.user_id',
      this.userId,
    );

    if (params.filter != null) {
      baseQuery = SavedItemDataService.buildFilterQuery(
        baseQuery,
        params.filter,
      );
    }

    // Pagination requires a stable sort,
    // item_id sort is to resolve ties with stable sort (e.g. null sort field)
    baseQuery.orderBy(sortColumn, sortOrder.toLowerCase(), 'item_id', 'asc');

    return paginate(
      // Need to use a subquery in order to order by derived fields ('archivedAt')
      this.db.select('*').from(baseQuery.as('page_query')),
      {
        first: params.pagination?.first,
        last: params.pagination?.last,
        before: params.pagination?.before,
        after: params.pagination?.after,
        orderBy: sortColumn,
        orderDirection: sortOrder,
      },
      {
        primaryKey: 'id',
        modifyEdgeFn: (edge): SavedItemSearchResultConnection => ({
          ...edge,
          //Format the node to conform to our SavedItem type.
          node: {
            savedItem: {
              ...edge.node,
            },
          },
        }),
      },
    );
  }
}
