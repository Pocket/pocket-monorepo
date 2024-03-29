import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { searchShareableList } from './queries/ShareableList';
import { moderateShareableList } from './mutations/ShareableList';
import { UserResolver } from '../../shared/resolvers/fields/User';
import { ShareableListItem } from '../../database/types';

export const resolvers = {
  ...PocketDefaultScalars,
  ShareableListComplete: {
    user: UserResolver,
  },
  ShareableListItem: {
    itemId: (parent: ShareableListItem) => parent.itemId.toString(),
  },
  Query: { searchShareableList },
  Mutation: { moderateShareableList },
};
