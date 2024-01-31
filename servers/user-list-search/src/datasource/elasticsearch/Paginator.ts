import { SearchResponse } from 'elasticsearch';
import {
  ElasticSearchSavedItem,
  SavedItemSearchResultConnection,
  SearchSavedItemEdge,
} from '../../types';

/**
 * Extract and format pagination information from elasticsearch
 * response, to create Connection which conforms to relay pagination spec.
 * The cursor does not encode which fields were used
 * for sorting. It's up to the client to ensure that they
 * are using the same filter and sort fields when paginating
 * through search results.
 * TODO: Populate hasNextPage and hasPreviousPage values
 */
export class Paginator {
  private static cursorSeparator = '__+__';
  public static encodeCursor(sortValues: string[]): string {
    return Buffer.from(sortValues.join(Paginator.cursorSeparator)).toString(
      'base64'
    );
  }
  public static decodeCursor(cursor: string): string[] {
    return Buffer.from(cursor, 'base64').toString().split(this.cursorSeparator);
  }
  public static resultToConnection(
    input: SearchResponse<ElasticSearchSavedItem>
  ): SavedItemSearchResultConnection {
    const edges: SearchSavedItemEdge[] = input.hits.hits.map((item) => ({
      cursor: Paginator.encodeCursor(item.sort),
      node: {
        savedItem: {
          id: item._source.item_id.toString(),
        },
        searchHighlights: {
          ...item.highlight,
          fullText: item.highlight?.full_text ?? null,
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
    const totalCount = Number.isInteger(input.hits.total)
      ? input.hits.total
      : (input.hits.total as any).value;
    return {
      edges,
      totalCount,
      pageInfo,
    };
  }
}
