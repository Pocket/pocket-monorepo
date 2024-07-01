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
import { CorpusDocumentProperties } from './types';
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

  constructor(private opts: QuerySearchCorpusArgs) {
    this.builder = esb.requestBodySearch();
  }
  private build() {
    const query = esb.boolQuery().must(this.query()).filter(this.filter());
    const builder = this.paginate(this.builder, this.opts.pagination);
    return builder
      .query(query)
      .sorts(
        this.sort(this.opts.sort?.sortBy, 'desc' as ElasticSearchSortDirection),
      ) // TODO: fix
      .highlight(this.highlight());
  }
  private query(): esb.SimpleQueryStringQuery {
    return esb
      .simpleQueryStringQuery(this.opts.search.query)
      .fields(
        CorpusSearchFieldsMap[this.opts.search.field ?? 'ALL_CONTENTFUL'],
      );
  }
  public toJSON() {
    return this.build().toJSON();
  }
  private paginate(
    builder: esb.RequestBodySearch,
    pagination: ValidPagination | OffsetPaginationInput,
  ): esb.RequestBodySearch {
    const size =
      pagination?.['limit'] ??
      pagination?.['first'] ??
      config.pagination.defaultPageSize;
    const sized = builder.size(size);
    if (pagination?.['after']) {
      const cursor = Paginator.decodeCursor(pagination['after']);
      return sized.searchAfter(cursor);
    } else if (pagination?.['offset']) {
      return sized.searchAfter(pagination['offset']);
    }
    return sized;
  }
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
    // This is ugly but... I mean... it's straightforward...
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
        this.publishedDateRange(
          filterOpts.publishedDateRange.before,
          filterOpts.publishedDateRange.after,
        ),
      );
    }
    if (filterOpts.addedDateRange != null) {
      musts.push(
        this.addedDateRange(
          filterOpts.addedDateRange.before,
          filterOpts.addedDateRange.after,
        ),
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
  // TODO: Fix this call signature
  private publishedDateRange(before: Date, after?: Date): esb.RangeQuery;
  private publishedDateRange(before: undefined, after: Date): esb.RangeQuery;
  private publishedDateRange(before?: Date, after?: Date): esb.RangeQuery {
    const base = esb.rangeQuery('published_at');
    if (before != null) {
      base.lt(toISODate(before));
    }
    if (after != null) {
      base.gte(toISODate(after));
    }
    return base;
  }
  // TODO: Fix this call signature
  private addedDateRange(before: Date, after?: Date): esb.RangeQuery;
  private addedDateRange(before: undefined, after: Date): esb.RangeQuery;
  private addedDateRange(before?: Date, after?: Date): esb.RangeQuery {
    const base = esb.rangeQuery('created_at').format('strict_date_time');
    if (before != null) {
      base.lt(before.toISOString());
    }
    if (after != null) {
      base.gte(after.toISOString());
    }
    return base;
  }
  public highlight(): esb.Highlight {
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

export async function keywordSearch(args: QuerySearchCorpusArgs) {
  const qb = new CorpusSearch(args);
  const body = qb.toJSON();
  const index =
    config.aws.elasticsearch.corpus.index[args.filter.language.toLowerCase()];
  const res = await client.search<
    estypes.SearchResponse<CorpusDocumentProperties>
  >({
    index,
    body,
  });
  return res.body;
}
