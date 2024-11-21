import { gql } from 'graphql-tag';
import { print } from 'graphql';

const NoteFragment = gql`
  fragment NoteFields on Note {
    id
    title
    docContent
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

export const GET_NOTE = print(gql`
  ${NoteFragment}
  query GetNote($id: ID!) {
    note(id: $id) {
      ...NoteFields
    }
  }
`);
