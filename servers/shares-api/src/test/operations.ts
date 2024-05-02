import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const CREATE_SHARE = print(gql`
  mutation CreateShareLink($target: ValidUrl!, $context: ShareContextInput) {
    createShareLink(target: $target, context: $context) {
      shareUrl
    }
  }
`);

export const GET_SHARE = print(gql`
  query GetShare($slug: ID!) {
    shareSlug(slug: $slug) {
      ... on PocketShare {
        slug
        shareUrl
        targetUrl
        createdAt
        context {
          note
          highlights {
            quote
          }
        }
      }
      ... on ShareNotFound {
        message
      }
    }
  }
`);

export const ADD_SHARE_CONTEXT = print(gql`
  mutation addShareContext($slug: ID!, $context: ShareContextInput!) {
    addShareContext(slug: $slug, context: $context) {
      ... on PocketShare {
        slug
        context {
          note
          highlights {
            quote
          }
        }
      }
      ... on ShareNotFound {
        message
      }
    }
  }
`);
