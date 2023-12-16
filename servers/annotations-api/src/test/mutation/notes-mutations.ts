import { gql } from 'graphql-tag';

export const CREATE_NOTE = gql`
  mutation createSavedItemHighlightNote($id: ID!, $input: String!) {
    createSavedItemHighlightNote(id: $id, input: $input) {
      text
    }
  }
`;

export const UPDATE_NOTE = gql`
  mutation updateSavedItemHighlightNote($id: ID!, $input: String!) {
    updateSavedItemHighlightNote(id: $id, input: $input) {
      text
    }
  }
`;

export const DELETE_NOTE = gql`
  mutation deleteSavedItemHighlightNote($id: ID!) {
    deleteSavedItemHighlightNote(id: $id)
  }
`;
