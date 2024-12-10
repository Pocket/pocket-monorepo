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

export const CREATE_NOTE = print(gql`
  ${NoteFragment}
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      ...NoteFields
    }
  }
`);

export const CREATE_NOTE_QUOTE = print(gql`
  ${NoteFragment}
  mutation CreateNoteFromQuote($input: CreateNoteFromQuoteInput!) {
    createNoteFromQuote(input: $input) {
      ...NoteFields
    }
  }
`);

export const EDIT_NOTE_TITLE = print(gql`
  ${NoteFragment}
  mutation EditNoteTitle($input: EditNoteTitleInput!) {
    editNoteTitle(input: $input) {
      ...NoteFields
    }
  }
`);

export const EDIT_NOTE_CONTENT = print(gql`
  ${NoteFragment}
  mutation EditNoteContent($input: EditNoteContentInput!) {
    editNoteContent(input: $input) {
      ...NoteFields
    }
  }
`);

export const DELETE_NOTE = print(gql`
  mutation DeleteNote($input: DeleteNoteInput!) {
    deleteNote(input: $input)
  }
`);
