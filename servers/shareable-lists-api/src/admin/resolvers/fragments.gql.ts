import { gql } from 'graphql-tag';
import { ShareableListItemPublicProps } from '../../shared/fragments.gql';

export const ShareableListCompleteProps = gql`
  fragment ShareableListCompleteProps on ShareableListComplete {
    externalId
    title
    description
    slug
    status
    moderationStatus
    createdAt
    updatedAt
    moderatedBy
    moderationReason
    moderationDetails
    restorationReason
    listItems {
      ...ShareableListItemPublicProps
    }
  }
  ${ShareableListItemPublicProps}
`;
