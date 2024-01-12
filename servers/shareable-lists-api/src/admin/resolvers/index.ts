import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { searchShareableList } from './queries/ShareableList';
import { moderateShareableList } from './mutations/ShareableList';
import { UserResolver } from '../../shared/resolvers/fields/User';
import { PrismaBigIntResolver } from '../../shared/resolvers/fields/PrismaBigInt';

export const resolvers = {
  ...PocketDefaultScalars,
  ShareableListComplete: {
    user: UserResolver,
  },
  ShareableListItem: {
    itemId: PrismaBigIntResolver,
  },
  Query: { searchShareableList },
  Mutation: { moderateShareableList },
};
