import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { UserResolver } from '../../shared/resolvers/fields/User';
import {
  getShareableList,
  getShareableListPublic,
  getShareableLists,
} from './queries/ShareableList';
import { isPilotUser } from './queries/PilotUser';
import {
  addToShareableList,
  createShareableList,
  deleteShareableList,
  updateShareableList,
  createAndAddToShareableList,
} from './mutations/ShareableList';
import {
  createShareableListItem,
  deleteShareableListItem,
  updateShareableListItem,
  updateShareableListItems,
} from './mutations/ShareableListItem';
import { ListItemsResolver } from '../../shared/resolvers/fields/ShareableList';
import { ShareableListItem } from '../../database/types';

export const resolvers = {
  ...PocketDefaultScalars,
  ShareableList: {
    user: UserResolver,
    listItems: ListItemsResolver,
  },
  ShareableListPublic: {
    user: UserResolver,
    listItems: ListItemsResolver,
  },
  ShareableListItem: {
    itemId: (parent: ShareableListItem) => parent.itemId.toString(),
  },
  Mutation: {
    createShareableList,
    deleteShareableList,
    updateShareableList,
    createShareableListItem,
    updateShareableListItem,
    updateShareableListItems,
    deleteShareableListItem,
    addToShareableList,
    createAndAddToShareableList,
  },
  Query: {
    shareableList: getShareableList,
    shareableListPublic: getShareableListPublic,
    shareableLists: getShareableLists,
    shareableListsPilotUser: isPilotUser,
  },
};
