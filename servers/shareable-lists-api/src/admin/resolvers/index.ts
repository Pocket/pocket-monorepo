import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { searchShareableList } from './queries/ShareableList.js';
import { moderateShareableList } from './mutations/ShareableList.js';
import { UserResolver } from '../../shared/resolvers/fields/User.js';
import { ShareableListItem } from '../../database/types.js';

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
