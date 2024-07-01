import { gql } from 'graphql-tag';

export const SEARCH_CORPUS = gql`
  query searchCorpus(
    $search: CorpusSearchQueryString!
    $filter: CorpusSearchFilters!
    $sort: CorpusSearchSort
    $pagination: PaginationInput
  ) {
    searchCorpus(
      search: $search
      filter: $filter
      sort: $sort
      pagination: $pagination
    ) {
      edges {
        cursor
        node {
          url
          searchHighlights {
            fullText
            title
            excerpt
            publisher
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;
