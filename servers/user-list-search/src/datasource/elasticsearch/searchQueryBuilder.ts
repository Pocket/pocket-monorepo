import { DefaultSortDirection, ValidPagination } from '../../types';
import {
  ElasticSearchSortField,
  ElasticSearchSortDirection,
  ElasticSearchFilterStatus,
  ElasticSearchContentType,
} from './elasticsearchSearch';
import { config } from '../../config';
import { Paginator } from './Paginator';
import {
  UserAdvancedSearchArgs,
  AdvancedSearchFilters,
  SearchSortInput,
  OffsetPaginationInput,
} from '../../__generated__/types';

/**
 * Build elasticsearch query from graphql input.
 *
 * Uses the simple_query_string method for full
 * text search across title, full_text, and domain.
 * Allowed queries include:
 *   - prefix (wildcard)
 *   - precedence
 *   - and/or/not
 *   - phrase (quote)
 *   - multi-term (whitespace-separated)
 *
 * If title or domain are included as filters, they
 * won't also be included in the full text search fields
 * to improve relevance scoring.
 *
 * It's also possible to search with just filters,
 * but at least one of filters or (non-empty) query string must
 * be provided. This is enforced by the calling function.
 *
 * Sort is with relevance by default, but a custom sort field
 * can be provided. Uses item_id, ascending for tiebreaker.
 * Can paginate with cursors; client must ensure consistent
 * sort and filter values when paginating through results.
 */
export class SearchQueryBuilder {
  parse(
    input: Omit<UserAdvancedSearchArgs, 'pagination'> & {
      pagination?: ValidPagination | OffsetPaginationInput;
    },
    userId: string,
  ) {
    const filters = this.buildFilters(input.filter, userId);
    const query = this.queryString(input);
    const sort = this.sort(input.sort);
    const paginate = this.paginate(input.pagination);
    // This will always be populated (by defaults if not specified)
    const base = { ...sort, ...paginate };
    if (query && filters) {
      return {
        ...base,
        query: {
          bool: {
            must: query,
            ...filters,
          },
        },
      };
    } else if (filters) {
      return {
        ...base,
        query: { bool: { ...filters } },
      };
    } else {
      return {
        ...base,
        query,
      };
    }
  }
  private queryString(
    input: Pick<UserAdvancedSearchArgs, 'queryString' | 'filter'>,
  ) {
    if (input.queryString == null) {
      return undefined;
    }
    const query = input.queryString
      .replace(' AND ', ' + ')
      .replace(' OR ', ' | ')
      .replace(' NOT ', ' -');
    const fields = ['full_text'];
    if (input.filter?.domain == null) {
      fields.push('url.keyword^2');
    }
    if (input.filter?.title == null) {
      fields.push('title^10');
    }
    return {
      simple_query_string: {
        query,
        fields,
        analyze_wildcard: true,
        flags: 'OR|AND|NOT|PHRASE|PRECEDENCE|WHITESPACE|PREFIX',
      },
    };
  }
  private buildFilters(filter: AdvancedSearchFilters, userId: string) {
    const userFilter = this.user(userId);
    if (filter == null) {
      return {
        filter: userFilter,
      };
    }
    const builders = {
      tags: this.tags,
      isFavorite: this.favorite,
      domain: this.domain,
      title: this.title,
      contentType: this.contentType,
      status: this.status,
    };
    const validFilters = Object.keys(filter).map((key) =>
      builders[key](filter[key]),
    );
    validFilters.push(userFilter);
    return {
      filter: {
        bool: {
          must: validFilters,
        },
      },
    };
  }

  private user(userId: string) {
    return { term: { user_id: parseInt(userId) } };
  }
  private tags(tags: AdvancedSearchFilters['tags']) {
    if (tags.length === 1) {
      return { term: { 'tags.keyword': tags[0] } };
    } else {
      return { terms: { 'tags.keyword': tags } };
    }
  }
  private favorite(favorite: AdvancedSearchFilters['isFavorite']) {
    return { term: { favorite } };
  }
  private domain(domain: AdvancedSearchFilters['domain']) {
    // Strip protocol if given
    const cleanedDomain = domain
      .replace(/^(http:\/\/|https:\/\/)*(www.)*/, '')
      .replace('*', '');
    return { wildcard: { 'url.keyword': { value: `*${cleanedDomain}*` } } };
  }
  private title(title: AdvancedSearchFilters['title']) {
    return { match: { title: { query: title, fuzziness: 'AUTO' } } };
  }
  private status(status: AdvancedSearchFilters['status']) {
    return {
      term: { status: ElasticSearchFilterStatus[status].toLowerCase() },
    };
  }
  private contentType(contentType: AdvancedSearchFilters['contentType']) {
    return { term: { content_type: ElasticSearchContentType[contentType] } };
  }
  private sort(input?: SearchSortInput) {
    const sortQuery = input?.sortBy
      ? {
          [ElasticSearchSortField[input.sortBy]]:
            ElasticSearchSortDirection[
              input.sortOrder ?? DefaultSortDirection.get(input.sortBy)
            ],
        }
      : '_score';

    return {
      sort: [
        sortQuery,
        {
          // tie-breaker
          item_id: 'asc',
        },
      ],
    };
  }
  private paginate(input?: ValidPagination | OffsetPaginationInput): {
    size: number;
    search_after?: string[];
  } {
    const size =
      input?.['limit'] ?? input?.['first'] ?? config.pagination.defaultPageSize;
    const pagination = { size };
    if (input?.['after']) {
      const cursor = Paginator.decodeCursor(input['after']);
      pagination['search_after'] = cursor;
    } else if (input?.['offset']) {
      pagination['search_after'] = input['offset'];
    }
    return pagination;
  }
}
