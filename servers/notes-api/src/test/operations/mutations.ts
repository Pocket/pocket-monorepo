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

export const CREATE_NOTE = print(gql`
  ${NoteFragment}
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      ...NoteFields
    }
  }
`);
