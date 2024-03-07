import { GetResponse, SearchResponse } from 'elasticsearch';
import { client } from './index';
import { config } from '../../config';
import {
  ElasticSearchSavedItem,
  Pagination,
  SavedItemSearchResultConnection,
  AdvancedSearchParams,
  SearchSavedItemEdge,
  SearchSavedItemParameters,
  SearchSavedItemOffsetParams,
  SavedItemSearchResultPage,
  SavedItemSearchResult,
  AdvancedSearchByOffsetParams,
} from '../../types';
import { UserInputError, validatePagination } from '@pocket-tools/apollo-utils';
import { SearchQueryBuilder } from './searchQueryBuilder';
import { Paginator } from './Paginator';
import { result } from 'lodash';

const { index, type, defaultQueryScore } = config.aws.elasticsearch;

export enum FunctionalBoostOperation {
  ADD = 'ADD',
  MULTIPLY = 'MULTIPLY',
}

export const ElasticSearchFilterStatus = {
  ARCHIVED: 'ARCHIVED',
  UNREAD: 'QUEUED',
};

export enum ElasticSearchSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const ElasticSearchSortField = {
  CREATED_AT: 'date_added',
  TIME_TO_READ: 'word_count',
  RELEVANCE: '_score',
};

export const ElasticSearchContentType = {
  VIDEO: 'video',
  ARTICLE: 'article',
  IMAGE: 'image',
};

export type FunctionScoreQuery = {
  query: {
    function_score: {
      query: any;
      boost_mode: string;
      functions: ScriptScoreFunction[];
    };
  };
};

export type Term = {
  term: {
    [key: string]: number | string | boolean;
  };
};

export type SearchHighlightFields = {
  [key: string]: {
    fragment_size: number;
  };
};

// Query input doesn't have userId as a filter since it's pulled
// from the context
export type InputFilter = {
  tags?: string[];
  status?: string;
  favorite?: boolean;
  contentType?: string;
  domain?: string;
};

// Query input for `search`
export type SearchParams = {
  term: string;
  fields: string[];
  from?: number;
  size?: number;
  sort?: {
    field: string;
    direction: ElasticSearchSortDirection;
  };
  filters?: InputFilter;
  highlightFields?: {
    field: string;
    size: number;
  }[];
  functionalBoosts?: {
    field: string;
    value: string | boolean;
    operation: FunctionalBoostOperation;
    factor: number;
  }[];
};

//todo: can simplify this type once we refactor ElasticSearchParams
// to not include userId as filter.

// Include userId as a filter for elasticSearch, but it's not
// input into the query
export type ElasticSearchParams = Omit<SearchParams, 'filters'> & {
  filters: ElasticSearchFilter;
};
export type ElasticSearchFilter = InputFilter & { userId: string };

export type Item = {
  itemId: string;
  highlights?: Record<string, unknown>;
};

export type PocketSearchResponse = {
  results: Item[];
  totalResults: number;
};

/**
 * Gets an elasticsearch document by id
 * @param id
 */
export const getDocument = async (id: string): Promise<GetResponse<any>> => {
  return client.get({
    index,
    id,
    type,
    routing: id.split('-')[0],
  });
};

/**
 * Get terms
 * @param field
 * @param values
 */
export const getTerms = (
  field: string,
  values: Array<number | string | boolean>,
): Term[] => {
  if (!values) return [];
  return values.map((value: number | string | boolean): Term => {
    return {
      term: { [field]: typeof value === 'string' ? value.trim() : value },
    };
  });
};

export const getSearchHighlightFields = (
  highlightFields: SearchParams['highlightFields'],
): SearchHighlightFields => {
  const searchHighlightFields = {};

  highlightFields.forEach((field) => {
    searchHighlightFields[field.field] = { fragment_size: field.size };
  });

  return searchHighlightFields;
};

/**
 * key names for filters need to be formatted in various ways for elasticsearch.
 * it may be worth breaking this function out if additional formatting is needed.
 * @param key
 */
export const formatFilterKey = (key: string): string => {
  const filterKeyMap = {
    userId: 'user_id',
    contentType: 'content_type',
  };

  // we need to set "<field>.keyword" to do exact match. This is the behavior for tags in production
  key = key === 'tags' ? `${key}.keyword` : filterKeyMap[key] || key;

  return key;
};

export const formatFilterValues = (key: string, values: any): Array<any> => {
  // force values to be an array (even if it's a single string)
  if (!Array.isArray(values)) {
    values = [values];
  }

  // ES is case-sensitive on the filters so convert our CAPS enum to lowercase
  if (key === 'status') {
    values = values.map((v) => (v ? v.toLowerCase() : null));
  }

  return values;
};

/**
 * Get filter terms
 * @param filters
 */
export const getFilterTerms = (
  filters: ElasticSearchParams['filters'],
): Record<string, unknown> => {
  const filterTerms = [];

  Object.keys(filters).forEach((key) => {
    if (key === `domain`) {
      return;
    }
    let values = filters[key];

    // we need to allow false (for things like `favorite`), but skip other falsy's
    if (values !== false && !values) {
      return;
    }

    // we need to set "<field>.keyword" to do exact match. This is the behavior for tags in production
    key = formatFilterKey(key);
    values = formatFilterValues(key, values);

    const terms = getTerms(key, values);

    filterTerms.push(...terms);
  });

  const elasticSearchFilterFormat: any = [
    {
      bool: {
        must: filterTerms,
      },
    },
  ];

  if (filters.domain) {
    elasticSearchFilterFormat.push({
      wildcard: {
        url: `*${filters.domain}*`,
      },
    });
  }

  return elasticSearchFilterFormat;
};

export enum FunctionalBoostOperationsMap {
  ADD = '+',
  MULTIPLY = '*',
}

export type ScriptScoreFunctionScript = {
  params?: { factor: number };
  source: string;
};

export type ScriptScoreFunction = {
  filter?: {
    match: {
      [key: string]: boolean | string;
    };
  };
  script_score: {
    script: ScriptScoreFunctionScript | string;
  };
};

/**
 * Creates script score function for each functional boost field
 * @param functionalBoosts
 * @param queryScore
 */
const getScriptScoreFunctions = (
  functionalBoosts: SearchParams['functionalBoosts'],
  queryScore: number,
): ScriptScoreFunction[] => {
  return functionalBoosts.map<ScriptScoreFunction>((functionalBoost) => {
    const transOperation =
      FunctionalBoostOperationsMap[functionalBoost.operation];

    return {
      filter: { match: { [functionalBoost.field]: functionalBoost.value } },
      script_score: {
        script: {
          params: { factor: functionalBoost.factor },
          source: `_score > 0 ? (_score ${transOperation} params.factor) : (${queryScore} ${transOperation} params.factor)`,
        },
      },
    };
  });
};

/**
 * Modifies the ES query to a function score query in order to add function boosts
 * @param body
 * @param functionalBoosts
 * @param queryScore
 */
export const applyFunctionalBoosts = (
  body: any,
  functionalBoosts: ElasticSearchParams['functionalBoosts'],
  queryScore = 1,
): FunctionScoreQuery => {
  return {
    query: {
      function_score: {
        query: body.query,
        // boost_mode tells elasticsearch to replace default score boost with function scores
        boost_mode: 'replace',
        functions: [
          {
            script_score: {
              script: `_score > 0 ? _score : ${queryScore}`,
            },
          },
          ...getScriptScoreFunctions(functionalBoosts, queryScore),
        ],
      },
    },
  };
};

/**
 * Builds the elasticsearch query | search request body
 * @param param0
 */
export const buildSearchBody = ({
  term,
  fields,
  from,
  size,
  sort,
  filters,
  highlightFields,
  functionalBoosts,
}: ElasticSearchParams): Record<string, unknown> => {
  console.log(
    'elasticsearch.buildSearchBody',
    JSON.stringify({
      term,
      fields,
      from,
      size,
      sort,
      filters,
      highlightFields,
      functionalBoosts,
    }),
  );

  term = term.trim();

  let body: any = {
    query: {
      bool: {
        // when there is no search term, we want to allow searching with just filters - this is the existing behavior
        [term ? 'must' : 'should']: {
          query_string: {
            query: term ? `${term}*` : '',
            fields,
            analyze_wildcard: true,
          },
        },
      },
    },
  };

  if (filters != null) {
    body.query.bool = {
      ...body.query.bool,
      filter: getFilterTerms(filters),
    };
  }

  if (functionalBoosts) {
    body = applyFunctionalBoosts(
      body,
      functionalBoosts,
      defaultQueryScore as number,
    );
  }

  if (highlightFields) {
    body['highlight'] = { fields: getSearchHighlightFields(highlightFields) };
  }

  // default to sorting by search score
  //www.elastic.co/guide/en/elasticsearch/reference/8.0/sort-search-results.html
  body['sort'] = sort ? [{ [sort.field]: sort.direction }] : ['_score'];

  // TODO: set from and size defaults when making search improvements
  // suggested defaults are from = 0 and size = 25
  if (from >= 0 && size) {
    body['from'] = from;
    body['size'] = size;
  }

  return body;
};

type ExtractedSearchTerms = {
  tags: string[];
  search: string;
};

export function cleanSearchTerm(searchTerm: string): string {
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
  const delimited = searchTerm.replace(
    /[+\-=!(){}[\]^"~*?:\\/]|&{2}|\|{2}/g,
    '\\$&',
  );
  // < and > can't be escaped; remove them
  // note: whitespace is not considered an operator
  // if this causes the query to be empty, the result will be empty
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_whitespaces_and_empty_queries
  return delimited.replace(/[<>]/g, ' ');
}

/**
 * Parse and separate tags from search terms.
 * @param searchTerm input search term
 * @returns ExtractedSearchTerms object containing tag keywords and
 * a search string, with ElasticSearch reserved characters escaped
 * with backlash.
 */
export function extractSearchValues(searchTerm: string): ExtractedSearchTerms {
  // Parse tags from the search terms
  // First non-capturing group is the tag prefix, '#' or 'tag:'
  // Capturing group is a string delimited by double quotes (greedy),
  // or any other string up until a space character (greedy).
  // The capturing group is the actual tag keyword you want to filter on.
  const tagRegex = /(?:#|tag:)("[^"]+"|[^ ]+)/g;
  const tagMatches = [...searchTerm.matchAll(tagRegex)];

  // Grab the first capturing group from the match (the actual value
  // of the tag keyword that you want to filter on)
  const tagKeywords = tagMatches.map((match) => {
    // Strip leading and trailing quotes if applicable
    return match[1].replace(/^"|"$/g, '');
  });

  // Remove any tags from the search so that you're left with just the
  // search terms (e.g. 'tag:coffee stores' => 'stores')
  tagMatches.forEach(([tagWithPrefix, _]) => {
    searchTerm = searchTerm
      .replace(tagWithPrefix, '')
      .replace(/\s+/g, ' ')
      .trim();
  });
  return {
    tags: tagKeywords,
    search: cleanSearchTerm(searchTerm),
  };
}

/**
 *Calculates the `from` field for elastic search.
 * @param pagination
 * @param size
 * @throws error if both before and after are set.
 */
export function calculateOffset(pagination: Pagination, size: number): number {
  pagination = validatePagination(
    pagination,
    config.pagination.defaultPageSize,
    config.pagination.maxPageSize,
  );

  if (pagination?.after) {
    return parseInt(Buffer.from(pagination.after, 'base64').toString()) + 1;
  }

  if (pagination?.before) {
    let offset = parseInt(Buffer.from(pagination.before, 'base64').toString());
    offset = offset - size;
    return offset < 0 ? 0 : offset;
  }

  if (pagination?.last && !pagination?.before) {
    throw new UserInputError(
      "premium search doesn't support pagination by last alone." +
        'Please use first or first/after or before/last combination',
    );
  }

  return 0;
}

/**
 *Calculates the `size` field when before is set in pagination input
 * @param pagination
 * @param size
 * @throws error if both before and after are set.
 */
export function calculateSize(pagination: Pagination, size: number): number {
  if (pagination?.after && pagination?.before) {
    throw new Error(
      'please set only before or after field in pagination input',
    );
  }

  if (pagination?.before) {
    const offset = parseInt(
      Buffer.from(pagination.before, 'base64').toString(),
    );
    //to avoid returning item mentioned in `before`
    //as offset is indexed from 0, we return offset (otherwise offset-1)
    return Math.min(size, offset);
  }

  return size;
}

function mapSortFields(params: { sort?: SearchSavedItemParameters['sort'] }) {
  if (params.sort) {
    return {
      field: ElasticSearchSortField[params.sort.sortBy],
      direction: params.sort.sortOrder
        ? ElasticSearchSortDirection[params.sort.sortOrder]
        : ElasticSearchSortDirection.ASC,
    };
  }
  return null;
}

/***
 * function to just retrieve domain.
 * http://www.admin.pocket.com returns admin.pocket.com
 * @param domain domain passed by the client
 */
export function getCleanedupDomainName(domain: string): string {
  let hostname = domain.replace(/^(http:\/\/|https:\/\/)*(www.)*/, '');
  hostname = hostname.replace('*', '');
  return hostname;
}

export function generateSearchSavedItemsParams(
  params: SearchSavedItemParameters | SearchSavedItemOffsetParams,
  userId: string,
): ElasticSearchParams {
  const searchValues = extractSearchValues(params.term);
  const fields = [
    'title^5',
    'url^2',
    'full_text^1',
    'authors^0.75',
    'tags^10',
    'content_type^2',
  ];

  // Build pagination arguments. If not using limit/offset,
  // compute it from the cursor data.
  // Default value for pagination fields
  let size = 30;
  let from = 0;
  // Override size if provided
  if (params.pagination != null) {
    if ('first' in params.pagination) {
      size = params.pagination.first;
      from = calculateOffset(params.pagination, size);
    } else if ('last' in params.pagination) {
      size = params.pagination.last;
      from = calculateOffset(params.pagination, size);
    } else if ('limit' in params.pagination) {
      size = params.pagination.limit ?? 30;
      from = params.pagination.offset ?? 0;
    }
  }

  const searchParams: ElasticSearchParams = {
    term: searchValues.search,
    fields: fields,
    from,
    size,
    sort: mapSortFields(params),
    filters: {
      favorite: params.filter?.isFavorite,
      contentType: ElasticSearchContentType[params.filter?.contentType] ?? null,
      status: ElasticSearchFilterStatus[params.filter?.status] ?? null,
      userId: userId,
      tags: searchValues.tags,
      domain: params.filter?.domain
        ? getCleanedupDomainName(params.filter?.domain)
        : null,
    },
    highlightFields: [
      {
        field: 'title',
        size: 100,
      },
      { field: 'full_text', size: 100 },
      { field: 'url', size: 100 },
      { field: 'tags', size: 100 },
    ],
    functionalBoosts: [
      {
        field: `favorite`,
        value: true,
        operation: FunctionalBoostOperation.ADD,
        factor: 1,
      },
    ],
  };
  return searchParams;
}

async function advancedSearchBase(
  params: AdvancedSearchParams | AdvancedSearchByOffsetParams,
  userId: string,
): Promise<SearchResponse<ElasticSearchSavedItem>> {
  const body = new SearchQueryBuilder().parse(params, userId);
  body['highlight'] = {
    fields: {
      title: { fragment_size: 150, number_of_fragments: 0 },
      full_text: { fragment_size: 100 },
      url: { fragment_size: 100 },
    },
  };
  const result = await client.search<ElasticSearchSavedItem>({
    index,
    body,
    routing: userId,
  });
  return result;
}

export async function advancedSearch(
  params: AdvancedSearchParams,
  userId: string,
): Promise<SavedItemSearchResultConnection> {
  const result = await advancedSearchBase(params, userId);
  return Paginator.resultToConnection(result);
}

export async function advancedSearchByOffset(
  params: AdvancedSearchByOffsetParams,
  userId: string,
): Promise<SavedItemSearchResultPage> {
  const result = await advancedSearchBase(params, userId);
  const entries = Paginator.resultToPage(result);
  return {
    ...entries,
    limit: params.pagination?.limit ?? config.pagination.defaultPageSize,
    offset: params.pagination?.offset ?? 0,
  };
}

export async function searchSavedItemsByOffset(
  params: SearchSavedItemOffsetParams,
  userId: string,
): Promise<SavedItemSearchResultPage> {
  const { result, searchParams } = await searchBase(params, userId);
  const entries: SavedItemSearchResult[] = result.hits.hits.map((res: any) => ({
    savedItem: { id: res._source.item_id },
    searchHighlights: {
      ...res.highlight,
      fullText: res.highlight?.full_text ?? null,
    },
  }));
  return {
    entries,
    limit: searchParams.size,
    offset: searchParams.from,
    totalCount: result.hits.total['value'],
  };
}

async function searchBase(
  params: SearchSavedItemParameters | SearchSavedItemOffsetParams,
  userId: string,
): Promise<{
  result: SearchResponse<unknown>;
  searchParams: ElasticSearchParams;
}> {
  const searchParams = generateSearchSavedItemsParams(params, userId);
  const body = buildSearchBody(searchParams);

  const result = await client.search({
    index,
    body,
    routing: userId,
  });
  return { result, searchParams };
}

/**
 * access elastic search by constructing the request.
 * note: max allowed pageSize is restricted to 30.
 * Response structure is referred from these documents
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html
 * aws response: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/searching.html
 */
export async function searchSavedItems(
  params: SearchSavedItemParameters,
  userId: string,
): Promise<SavedItemSearchResultConnection> {
  const { result, searchParams } = await searchBase(params, userId);
  let cursor: number = searchParams.from;
  const searchResultsEdges: SearchSavedItemEdge[] = result.hits.hits.map(
    (res: any) => {
      const response = {
        cursor: Buffer.from(cursor.toString()).toString('base64'),
        node: {
          savedItem: { id: res._source.item_id },
          searchHighlights: {
            ...res.highlight,
            fullText: res.highlight?.full_text ?? null,
          },
        },
      };
      cursor++;
      return response;
    },
  );
  const endCursor = Buffer.from(
    (searchParams.from + searchResultsEdges.length - 1).toString(),
  ).toString('base64');
  const response = {
    edges: searchResultsEdges,
    pageInfo: {
      endCursor: searchResultsEdges.length == 0 ? null : endCursor,
      hasNextPage:
        result.hits.total['value'] > searchParams.from + searchParams.size,
      hasPreviousPage: searchParams.from > 0,
      startCursor:
        searchResultsEdges.length == 0
          ? null
          : Buffer.from(searchParams.from.toString()).toString('base64'),
    },
    totalCount: result.hits.total['value'],
  };
  return response;
}

/**
 * Search elasticsearch for documents
 * @param params
 */
export const search = async (
  params: ElasticSearchParams,
): Promise<PocketSearchResponse> => {
  const body = buildSearchBody(params);
  console.log('elasticsearch.search.body', JSON.stringify(body));

  try {
    const result = await client.search({
      index,
      body,
      routing: params.filters.userId,
      scroll: `30m`,
    });

    const searchResults = result.hits.hits.map((item: any): Item => {
      const itemId = item._source.item_id;
      return {
        highlights: item.highlight,
        itemId: itemId,
      };
    });

    const total = result.hits.total as unknown as {
      value: number;
      relation: string;
    };
    return {
      results: searchResults,
      totalResults: total.value,
    };
  } catch (e) {
    // query_string returns an error for invalid syntax, catch this error and return an empty result
    // replicate the same behavior as simple_query_string which is less strict on syntax
    return {
      results: [],
      totalResults: 0,
    };
  }
};
