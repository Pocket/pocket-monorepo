import { gql } from 'graphql-tag';
import { print } from 'graphql';

const NoteFragment = gql`
  fragment NoteFields on Note {
    id
    title
    docContent
    docMarkdown
    contentPreview
    createdAt
    updatedAt
    savedItem {
      url
    }
    source
    archived
    deleted
  }
`;

const PageInfoFragment = gql`
  fragment PageInfoFields on PageInfo {
    endCursor
    hasNextPage
    hasPreviousPage
    startCursor
  }
`;

export const GET_NOTE = print(gql`
  ${NoteFragment}
  query GetNote($id: ID!) {
    note(id: $id) {
      ...NoteFields
    }
  }
`);

export const GET_NOTES = print(gql`
  ${NoteFragment}
  ${PageInfoFragment}
  query GetNotes(
    $sort: NoteSortInput
    $filter: NoteFilterInput
    $pagination: PaginationInput
  ) {
    notes(sort: $sort, filter: $filter, pagination: $pagination) {
      pageInfo {
        ...PageInfoFields
      }
      totalCount
      edges {
        cursor
        node {
          ...NoteFields
        }
      }
    }
  }
`);

export const NOTES_FROM_SAVE = print(gql`
  ${NoteFragment}
  ${PageInfoFragment}
  query NotesFromSave(
    $sort: NoteSortInput
    $filter: SavedItemNoteFilterInput
    $pagination: PaginationInput
    $url: String
  ) {
    _entities(representations: { url: $url, __typename: "SavedItem" }) {
      ... on SavedItem {
        url
        notes(sort: $sort, filter: $filter, pagination: $pagination) {
          pageInfo {
            ...PageInfoFields
          }
          totalCount
          edges {
            cursor
            node {
              ...NoteFields
            }
          }
        }
      }
    }
  }
`);
