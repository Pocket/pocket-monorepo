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
  constructor(context: IContext) {}

  async keywordSearch(args: QuerySearchCorpusArgs) {
    const res = await keywordSearch(args);
    return this.toGraphQl(res);
  }

  private toGraphQl(
    body: estypes.SearchResponseBody<CorpusDocumentProperties>,
  ): CorpusSearchConnection {
    const edges: CorpusSearchEdge[] = body.hits.hits.map((doc) => ({
      cursor: Paginator.encodeCursor(doc.sort),
      node: {
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
