import { gql } from 'graphql-tag';

/**
 * This GraphQL fragment contains all the properties that must be available
 * in the Public Pocket Graph for a Shareable List Item.
 */
export const ShareableListItemPublicProps = gql`
  fragment ShareableListItemPublicProps on ShareableListItem {
    externalId
    itemId
    url
    title
    excerpt
    note
    imageUrl
    publisher
    authors
    sortOrder
    createdAt
    updatedAt
  }
`;

/**
 * This GraphQL fragment contains all the properties that must be available
 * in the Public Pocket Graph for a Shareable List.
 */
export const ShareableListPublicProps = gql`
  fragment ShareableListPublicProps on ShareableList {
    externalId
    user {
      id
    }
    title
    description
    slug
    status
    moderationStatus
    createdAt
    updatedAt
    listItems {
      ...ShareableListItemPublicProps
    }
    listItemNoteVisibility
  }
  ${ShareableListItemPublicProps}
`;

/**
 * This GraphQL fragment contains all the properties that must be available
 * in the Public Pocket Graph for a Shareable List.
 */
export const ShareableListPublicQueryProps = gql`
  fragment ShareableListPublicQueryProps on ShareableListPublic {
    externalId
    user {
      id
    }
    title
    description
    slug
    status
    moderationStatus
    createdAt
    updatedAt
    listItems {
      ...ShareableListItemPublicProps
    }
    listItemNoteVisibility
  }
  ${ShareableListItemPublicProps}
`;
