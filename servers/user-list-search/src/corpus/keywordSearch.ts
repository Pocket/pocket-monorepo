import {
  CorpusContentType,
  CorpusSearchFields,
  CorpusSearchSortBy,
  OffsetPaginationInput,
  QuerySearchCorpusArgs,
} from '../__generated__/types';
import { config } from '../config';
import { client } from '../datasource/clients/openSearch';
import esb from 'elastic-builder';
import { CorpusDocumentProperties, DateRangeInput } from './types';
import { estypes } from '@elastic/elasticsearch';
import { ValidPagination } from '../saves/types';
import { Paginator } from '../datasource/elasticsearch/Paginator';
import { ElasticSearchSortDirection } from '../datasource/elasticsearch/elasticsearchSearch';
import { toISODate } from './utils';
import * as Sentry from '@sentry/node';

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

class CorpusSearch {
  private builder: esb.RequestBodySearch;

  /**
   * Utility for creating a query body that can be passed
   * to opensearch/elasticsearch clients, from the GraphQL
   * resolver arguments for corpus search
   * @param opts Arguments passed to GraphQL search query
   */
  constructor(private opts: QuerySearchCorpusArgs) {
    const query = esb.boolQuery().must(this.query()).filter(this.filter());
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
  private query(): esb.SimpleQueryStringQuery {
    return esb
      .simpleQueryStringQuery(this.opts.search.query)
      .fields(
        CorpusSearchFieldsMap[this.opts.search.field ?? 'ALL_CONTENTFUL'],
      );
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
  /**
   * Convert the filter options passed into the GraphQL
   * resolver into ES/opensearch request syntax.
   */
  private filter() {
    const filterOpts = this.opts.filter;
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
    if (filterOpts.excludeML === true) {
      mustNots.push(this.isML());
    }
    if (filterOpts.excludeCollections === true) {
      mustNots.push(this.isCollection());
    }
    const musts: esb.Query[] = [validCollectionFilter];
    if (filterOpts.author != null) {
      musts.push(this.author(filterOpts.author));
    }
    if (filterOpts.publisher != null) {
      musts.push(this.publisher(filterOpts.publisher));
    }
    if (filterOpts.publishedDateRange != null) {
      musts.push(
        this.publishedDateRange({
          before: filterOpts.publishedDateRange.before,
          after: filterOpts.publishedDateRange.after,
        }),
      );
    }
    if (filterOpts.addedDateRange != null) {
      musts.push(
        this.addedDateRange({
          before: filterOpts.addedDateRange.before,
          after: filterOpts.addedDateRange.after,
        }),
      );
    }
    if (filterOpts.topic != null) {
      const topicFilters = this.topics(filterOpts.topic);
      if (topicFilters.length > 1) {
        // OR combination if multiple
        musts.push(esb.boolQuery().should(topicFilters));
      } else {
        // Otherwise we put it on must
        musts.push(...topicFilters);
      }
    }
    if (filterOpts.contentType != null) {
      const contentFilters = this.contentType(filterOpts.contentType);
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
      'pocket_parser_extracted_text',
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

/**
 * Make a request to elasticsearch/opensearch client to serve
 * corpus search data.
 */
export async function keywordSearch(args: QuerySearchCorpusArgs) {
  const qb = new CorpusSearch(args);
  const body = qb.toJSON();
  const index =
    config.aws.elasticsearch.corpus.index[args.filter.language.toLowerCase()];
  try {
    const res = await client.search<
      estypes.SearchResponse<CorpusDocumentProperties>
    >({
      index,
      body,
    });
    return res.body;
  } catch (error) {
    // Since the error data might be not encapsulated in the
    // message, add breadcrubms for easier tracking
    if (error.meta && error.meta.body) {
      Sentry.addBreadcrumb({
        data: { error: error.meta.body.error, methodName: 'keywordSearch' },
      });
      throw error;
    } else {
      Sentry.addBreadcrumb({
        data: {
          error: error.message,
          methodName: 'keywordSearch',
        },
      });
    }
  }
}
