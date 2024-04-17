import { gql } from 'graphql-tag';
import { print } from 'graphql';

export const CREATE_SHARE = print(gql`
  mutation CreateShareLink($target: URL!, $context: ShareContextInput) {
    createShareLink(target: $target, context: $context)
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
