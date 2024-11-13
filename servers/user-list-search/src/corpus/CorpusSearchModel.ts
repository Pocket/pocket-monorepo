import {
  CorpusSearchConnection,
  CorpusSearchEdge,
  CorpusSearchFields,
  QuerySearchCorpusArgs,
} from '../__generated__/types';
import { keywordSearch } from './keywordSearch';
import { estypes } from '@elastic/elasticsearch';
import { CorpusDocumentProperties } from './types';
import { IContext } from '../server/context';
import { Paginator } from '../datasource/elasticsearch/Paginator';
import { config } from '../config';
import { unleash } from '../datasource/clients';
import { semanticSearch } from './semanticSearch';

export const CorpusSearchFieldsMap: Record<
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

export class CorpusSearchModel {
  constructor(private context: IContext) {}

  /**
   * Execute search. Handles the business logic for choosing
   * between keyword search and semantic search (depends on
   * language and feature flag). Converts to the expected GraphQL
   * response.
   */
  async search(args: QuerySearchCorpusArgs) {
    const embeddingsConfig = config.aws.elasticsearch.corpus.embeddings;
    const lang = args.filter.language.toLowerCase();
    const index = config.aws.elasticsearch.corpus.index[lang];
    const semanticEnabled = unleash().isEnabled(
      config.unleash.flags.semanticSearch.name,
      {
        userId: this.context.encodedUserId,
        remoteAddress: this.context.ip,
      },
      config.unleash.flags.semanticSearch.fallback,
    );

    // Requires language to be supported at baseline
    if (embeddingsConfig.enabledForIndex[index] && semanticEnabled) {
      const res = await semanticSearch(args);
      return this.toGraphQl(res);
    } else {
      const res = await keywordSearch(args);
      return this.toGraphQl(res);
    }
  }

  /**
   * Convert search response body from ES/Opensearch to GraphQL types
   */
  private toGraphQl(
    body: estypes.SearchResponseBody<CorpusDocumentProperties>,
  ): CorpusSearchConnection {
    const edges: CorpusSearchEdge[] = body.hits.hits.map((doc) => ({
      cursor: Paginator.encodeCursor(doc.sort),
      node: {
        id: doc._id,
        url: doc._source.url,
        searchHighlights: {
          title: doc.highlight?.title ?? null,
          excerpt: doc.highlight?.excerpt ?? null,
          publisher: doc.highlight?.publisher ?? null,
          fullText: doc.highlight?.pocket_parser_extracted_text ?? null,
        },
      },
    }));
    const pageInfo = {
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges.slice(-1)[0]?.cursor ?? null,
      hasNextPage: true, // TODO
      hasPreviousPage: true, // TODO
    };
    // There's a bug in the elasticsearch interface definition
    // Says it's an integer, but integration testing shows
    // { value: number, relation: string } (example relation='eq')
    // Parse it conditionally
    const totalCount = Number.isInteger(body.hits.total)
      ? body.hits.total
      : (body.hits.total as any).value;
    return {
      edges,
      totalCount,
      pageInfo,
    };
  }
}
