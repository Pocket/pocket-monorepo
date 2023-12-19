import { gql } from 'graphql-tag';

export const CREATE_HIGHLIGHTS = gql`
  mutation CreateHighlights($input: [CreateHighlightInput!]!) {
    createSavedItemHighlights(input: $input) {
      id
      patch
      version
      quote
      _createdAt
      _updatedAt
    }
  }
`;
export const CREATE_HIGHLIGHTS_WITH_NOTE = gql`
  mutation CreateHighlights($input: [CreateHighlightInput!]!) {
    createSavedItemHighlights(input: $input) {
      id
      patch
      version
      quote
      _createdAt
      _updatedAt
      note {
        text
      }
    }
  }
`;
export const UPDATE_HIGHLIGHT_DEPRECATED = gql`
  mutation updateSavedItemHighlight($id: ID!, $input: CreateHighlightInput!) {
    updateSavedItemHighlight(id: $id, input: $input) {
      id
      patch
      version
      quote
      _createdAt
      _updatedAt
    }
  }
`;
export const UPDATE_HIGHLIGHT = gql`
  mutation updateSavedItemHighlight($id: ID!, $input: UpdateHighlightInput!) {
    updateHighlight(id: $id, input: $input) {
      id
      patch
      version
      quote
      _createdAt
      _updatedAt
    }
  }
`;
export const DELETE_HIGHLIGHT = gql`
  mutation DeleteHighlight($id: ID!) {
    deleteSavedItemHighlight(id: $id)
  }
`;
