import { gql } from 'graphql-tag';
import { ShareableListCompleteProps } from '../fragments.gql';

export const MODERATE_SHAREABLE_LIST = gql`
  mutation moderateShareableList($data: ModerateShareableListInput!) {
    moderateShareableList(data: $data) {
      ...ShareableListCompleteProps
    }
  }
  ${ShareableListCompleteProps}
`;
