import {
  CorpusContentType,
  CorpusSearchFields,
  CorpusSearchFilters,
  CorpusSearchSortBy,
  OffsetPaginationInput,
  QuerySearchCorpusArgs,
} from '../__generated__/types';
import { config } from '../config';
import esb from 'elastic-builder';
import { CorpusDocumentProperties, DateRangeInput } from './types';
import { ValidPagination } from '../saves/types';
import { Paginator } from '../datasource/elasticsearch/Paginator';
import { ElasticSearchSortDirection } from '../datasource/elasticsearch/elasticsearchSearch';
import { toISODate } from './utils';
import * as Sentry from '@sentry/node';
import { sagemakerClient } from '../datasource/clients';
import {
  InvokeEndpointInput,
  InvokeEndpointCommand,
} from '@aws-sdk/client-sagemaker-runtime';

const CorpusSearchFieldsMap: Record<
  CorpusSearchFields,
  Array<keyof CorpusDocumentProperties>
> = {
  ALL_CONTENTFUL: ['title', 'excerpt', 'pocket_parser_extracted_text'],
  ALL: ['title', 'excerpt', 'pocket_parser_extracted_text', 'publisher'],
  EXTRACTED_CONTENT: ['pocket_parser_extracted_text'],
  EXCERPT: ['excerpt'],
  TITLE: ['title'],
  PUBLISHER: ['publisher'],
};

// Lengthy path shortcut
const embeddingsConfig = config.aws.elasticsearch.corpus.embeddings;

/**
 * Shared filter base for Semantic and Simple Query String queries
 */
class SearchQueryFilters {
  constructor(private filters: CorpusSearchFilters) {}
  /**
   * Convert the filter options passed into the GraphQL
   * resolver into ES/opensearch request syntax.
   */
  public filter() {
    // Always-on filters:
    // Only published/recommendation collection statuses
    // is_collection != true OR (is_collection == true AND (status == 'published' OR status == 'recommendation'))
    const validCollectionFilter = esb
      .boolQuery()
      .should([
        esb.boolQuery().mustNot(esb.termQuery('is_collection', true)),
        esb
          .boolQuery()
          .must([
            esb.termQuery('is_collection', true),
            esb
              .boolQuery()
              .should([
                esb.termQuery('status', 'published'),
                esb.termQuery('status', 'recommendation'),
              ]),
          ]),
      ]);
    // This set of statements feels inelegant but it's straightforward...
    // must-not top-level filters: excludeCollection and excludeML
    const mustNots: esb.Query[] = [];
    if (this.filters.excludeML === true) {
      mustNots.push(this.isML());
    }
    if (this.filters.excludeCollections === true) {
      mustNots.push(this.isCollection());
    }
    const musts: esb.Query[] = [validCollectionFilter];
    if (this.filters.author != null) {
      musts.push(this.author(this.filters.author));
    }
    if (this.filters.publisher != null) {
      musts.push(this.publisher(this.filters.publisher));
    }
    if (this.filters.publishedDateRange != null) {
      musts.push(
        this.publishedDateRange({
          before: this.filters.publishedDateRange.before,
          after: this.filters.publishedDateRange.after,
        }),
      );
    }
    if (this.filters.addedDateRange != null) {
      musts.push(
        this.addedDateRange({
          before: this.filters.addedDateRange.before,
          after: this.filters.addedDateRange.after,
        }),
      );
    }
    if (this.filters.topic != null) {
      const topicFilters = this.topics(this.filters.topic);
      if (topicFilters.length > 1) {
        // OR combination if multiple
        musts.push(esb.boolQuery().should(topicFilters));
      } else {
        // Otherwise we put it on must
        musts.push(...topicFilters);
      }
    }
    if (this.filters.contentType != null) {
      const contentFilters = this.contentType(this.filters.contentType);
      if (contentFilters.length > 1) {
        musts.push(esb.boolQuery().should(contentFilters));
      } else {
        // If there's only one value, it doesn't make sense for 'should'
        musts.push(...contentFilters);
      }
    }
    // We always have at least one must statement
    let filter = esb.boolQuery().must(musts);
    // must not is top-level
    mustNots.length && (filter = filter.mustNot(mustNots));
    return filter;
  }
  private isML() {
    return esb.termQuery('curation_source', 'ML');
  }
  private isCollection() {
    return esb.termQuery('is_collection', true);
  }
  private topics(topic: string[]): esb.TermQuery[] {
    return topic.map((t) => esb.termQuery('topic', t));
  }
  private publisher(publisher: string) {
    return esb.matchQuery('publisher', publisher);
  }
  private author(author: string) {
    return esb.matchQuery('authors', author);
  }
  private contentType(contentType: CorpusContentType[]): esb.TermQuery[] {
    const termMapping: Record<CorpusContentType, esb.TermQuery> = {
      [CorpusContentType.Article]: esb.termQuery(
        'content_type_parent',
        'article',
      ),
      [CorpusContentType.Video]: esb.termQuery('content_type_parent', 'video'),
      [CorpusContentType.Collection]: esb.termQuery('is_collection', true),
    };
    const getTermMap = (contentType: CorpusContentType) => {
      const term = termMapping[contentType];
      if (termMapping == null) {
        Sentry.addBreadcrumb({ data: { contentType } });
        Sentry.captureException({
          message: 'Invalid content type filter passed to corpus search',
          level: 'warning',
        });
      }
      return term;
    };
    return contentType.map((t) => getTermMap(t));
  }
  private publishedDateRange(input: DateRangeInput): esb.RangeQuery {
    const base = esb.rangeQuery('published_at');
    if (input.before != null) {
      base.lt(toISODate(input.before));
    }
    if (input.after != null) {
      base.gte(toISODate(input.after));
    }
    return base;
  }
  private addedDateRange(input: DateRangeInput): esb.RangeQuery {
    const base = esb.rangeQuery('created_at').format('strict_date_time');
    if (input.before != null) {
      base.lt(input.before.toISOString());
    }
    if (input.after != null) {
      base.gte(input.after.toISOString());
    }
    return base;
  }
}

/**
 * Query builder for semantic search
 */
export class SemanticSearchQueryBuilder extends SearchQueryFilters {
  constructor(
    private opts: Omit<QuerySearchCorpusArgs, 'search'> & {
      search: { query: number[] };
    },
  ) {
    super(opts.filter);
  }
  /**
   * Construct the query builder from a query string (rather than
   * a vector query).
   * Will return undefined if the vectors could not be fetched
   * to populate the query builder.
   * @param opts the search options passed from query
   * @param fallback whether to fall back to providing
   * a keyword search (via SimpleQueryStringBuilder) if
   * unable to fetch embeddings for whatever reason
   * (default=true)
   */
  public static async fromQueryString(
    opts: QuerySearchCorpusArgs,
    keywordFallback = true,
  ): Promise<SemanticSearchQueryBuilder | SimpleQueryStringBuilder> {
    const query = await SemanticSearchQueryBuilder.getQueryVec(
      opts.search.query,
    );
    if (query == null && keywordFallback) {
      return new SimpleQueryStringBuilder(opts);
    }
    return new SemanticSearchQueryBuilder({ ...opts, search: { query } });
  }

  /**
   * Return a JSON-like object which can
   * be used as a body in ES/opensearch client requests
   * See https://opensearch.org/docs/latest/search-plugins/knn/index/
   */
  public toJSON() {
    return this.knnQuery();
  }

  /**
   * Retrieve query vector from Sagemaker endpoint
   * Public because mocking the internals for testing
   * is a PITA and it's way easier to wrap the function itself.
   * @returns the vector query for knn search, or undefined
   * if it could not be retrieved.
   */
  public static async getQueryVec(
    query: string,
  ): Promise<Array<number> | undefined> {
    const client = sagemakerClient();
    const input: InvokeEndpointInput = {
      EndpointName: embeddingsConfig.endpoint,
      ContentType: 'application/json',
      Body: Buffer.from(JSON.stringify({ inputs: query })),
    };
    Sentry.addBreadcrumb({
      data: { query: query },
    });
    const command = new InvokeEndpointCommand(input);
    try {
      const response = await client.send(command);
      const vector = JSON.parse(response.Body.transformToString());
      // Probably should never be null/malformed without error, but ensure
      if (vector?.[0]?.[0]?.length > 0) {
        // Return [CLS] token
        return vector[0][0];
      }
      return undefined;
    } catch (error) {
      Sentry.captureException(error);
      return undefined;
    }
  }
  /**
   * Builds KNN query object for opensearch, with post-request
   * filters.
   * Filtering in the request requires an engine other than
   * nmslib, which is currently used. Because of this there may
   * be fewer results than `k` nearest neighbors.
   */
  private knnQuery() {
    const k =
      this.opts.pagination?.['limit'] ??
      this.opts.pagination?.['first'] ??
      config.pagination.defaultPageSize;
    // esb doesn't support hybrid or knn queries
    // for opensearch, since the APIs diverge
    // For now, just do this semi-manually
    const filter = this.filter();
    return {
      query: {
        bool: {
          filter: filter.toJSON(),
          must: [
            {
              knn: {
                [embeddingsConfig.propertyName]: {
                  vector: this.opts.search.query,
                  k,
                },
              },
            },
          ],
        },
      },
    };
  }
}

export class SimpleQueryStringBuilder extends SearchQueryFilters {
  private builder: esb.RequestBodySearch;

  /**
   * Utility for creating a query body that can be passed
   * to opensearch/elasticsearch clients, from the GraphQL
   * resolver arguments for corpus search
   * Automatically chooses whether to use keyword or
   * semantic depending on supported languages and/or
   * feature flag inclusion.
   * Hybrid search is not available as it requires opensearch
   * v2.16, and as of 2024-09-10 only up to v2.13 is on AWS.
   * @param opts Arguments passed to GraphQL search query
   */
  constructor(private opts: QuerySearchCorpusArgs) {
    super(opts.filter);
    this.kwQuery();
  }

  /**
   * Serialize to a JSON-like object which can
   * be used as a body in ES/opensearch client requests
   */
  public toJSON() {
    return this.builder.toJSON();
  }

  /**
   * Build the base simple query string from GraphQL
   * request, in ES/opensearch syntax.
   */
  private kwQuery() {
    const qb = esb
      .simpleQueryStringQuery(this.opts.search.query)
      .fields(
        CorpusSearchFieldsMap[this.opts.search.field ?? 'ALL_CONTENTFUL'],
      );
    const query = esb.boolQuery().must(qb).filter(this.filter());
    const builder = this.paginate(this.opts.pagination);
    const sortOrder = this.opts.sort?.sortOrder
      ? ElasticSearchSortDirection[this.opts.sort.sortOrder]
      : undefined;
    this.builder = builder
      .query(query)
      .sorts(this.sort(this.opts.sort?.sortBy, sortOrder))
      .highlight(this.highlight());
  }

  /**
   * Convert the pagination options passed into the GraphQL
   * resolver into ES/opensearch request syntax.
   */
  private paginate(
    pagination: ValidPagination | OffsetPaginationInput,
  ): esb.RequestBodySearch {
    const size =
      pagination?.['limit'] ??
      pagination?.['first'] ??
      config.pagination.defaultPageSize;
    const sized = esb.requestBodySearch().size(size);
    if (pagination?.['after']) {
      const cursor = Paginator.decodeCursor(pagination['after']);
      return sized.searchAfter(cursor);
    } else if (pagination?.['offset']) {
      return sized.searchAfter(pagination['offset']);
    }
    return sized;
  }
  /**
   * Convert the sort options passed into the GraphQL
   * resolver into ES/opensearch request syntax.
   */
  private sort(
    sortBy: CorpusSearchSortBy,
    sortOrder: ElasticSearchSortDirection,
  ): esb.Sort[] {
    const sortByMap: Record<CorpusSearchSortBy, string> = {
      [CorpusSearchSortBy.Relevance]: '_score',
      [CorpusSearchSortBy.DateAddedToCorpus]: 'created_at',
      [CorpusSearchSortBy.DatePublished]: 'published_at',
    };
    return [
      esb.sort(sortByMap[sortBy] ?? '_score', sortOrder ?? 'desc'), // default to descending for all sorts
      esb.sort('corpusId', 'asc'), // tiebreaker -- does not matter order
    ];
  }

  private highlight(): esb.Highlight {
    // Set default search field
    const searchField = this.opts.search.field ?? 'ALL_CONTENTFUL';
    const highlightFields = CorpusSearchFieldsMap[searchField];
    // Build highlight callback with default args
    let highlight = esb
      .highlight()
      .numberOfFragments(1)
      .fragmentSize(150)
      .fields(highlightFields);
    // Conditional rules for highlighted fields
    // Don't fragment short fields like title/excerpt -- just
    // return them since it'll look better for the user.
    const zeroFragmentFields: Array<keyof CorpusDocumentProperties> = [
      'title',
      'excerpt',
      'publisher',
    ];
    highlight = zeroFragmentFields.reduce((highlight, fieldName) => {
      if (highlightFields.indexOf(fieldName) >= 0) {
        highlight = highlight.numberOfFragments(0, fieldName);
      }
      return highlight;
    }, highlight);
    // Put full text findings in score order so most relevant fragments are first
    if (highlightFields.indexOf('pocket_parser_extracted_text') >= 0) {
      highlight = highlight.scoreOrder('pocket_parser_extracted_text');
    }
    return highlight;
  }
}
