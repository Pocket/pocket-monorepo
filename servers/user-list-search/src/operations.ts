import { gql } from 'graphql-tag';

export const SEARCH_SAVED_ITEM_QUERY = gql`
  query searchSavedItem(
    $id: ID!
    $term: String!
    $filter: SearchFilterInput
    $sort: SearchSortInput
    $pagination: PaginationInput
  ) {
    _entities(representations: { id: $id, __typename: "User" }) {
      ... on User {
        searchSavedItems(
          term: $term
          filter: $filter
          sort: $sort
          pagination: $pagination
        ) {
          edges {
            cursor
            node {
              savedItem {
                id
              }
              searchHighlights {
                tags
                fullText
                title
              }
            }
          }
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          totalCount
        }
      }
    }
  }
`;

export const RECENT_SEARCHES_QUERY = gql`
  query recentSearches($id: ID!) {
    _entities(representations: { id: $id, __typename: "User" }) {
      ... on User {
        recentSearches {
          term
          context {
            key
            value
          }
        }
      }
    }
  }
`;

export const SAVE_RECENT_SEARCH = gql`
  mutation saveRecentSearch($search: RecentSearchInput!) {
    saveSearch(search: $search) {
      term
    }
  }
`;

export const SEARCH_OFFSET_QUERY = gql`
  query searchSavedItem(
    $id: ID!
    $term: String!
    $filter: SearchFilterInput
    $sort: SearchSortInput
    $pagination: OffsetPaginationInput
  ) {
    _entities(representations: { id: $id, __typename: "User" }) {
      ... on User {
        searchSavedItemsByOffset(
          term: $term
          filter: $filter
          sort: $sort
          pagination: $pagination
        ) {
          entries {
            savedItem {
              id
            }
            searchHighlights {
              tags
              fullText
              title
            }
          }
          limit
          offset
          totalCount
        }
      }
    }
  }
`;
