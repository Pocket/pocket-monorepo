import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { UserResolver } from '../../shared/resolvers/fields/User.js';
import {
  getShareableList,
  getShareableListPublic,
  getShareableLists,
} from './queries/ShareableList.js';
import { isPilotUser } from './queries/PilotUser.js';
import {
  addToShareableList,
  createShareableList,
  deleteShareableList,
  updateShareableList,
  createAndAddToShareableList,
} from './mutations/ShareableList.js';
import {
  createShareableListItem,
  deleteShareableListItem,
  updateShareableListItem,
  updateShareableListItems,
} from './mutations/ShareableListItem.js';
import {
  ListItemsResolver,
  ListItemsConnectionResolver,
} from '../../shared/resolvers/fields/ShareableList.js';
import { ShareableListItem } from '../../database/types.js';

export const resolvers = {
  ...PocketDefaultScalars,
  ShareableList: {
    user: UserResolver,
    listItems: ListItemsResolver,
    items: ListItemsConnectionResolver,
  },
  ShareableListPublic: {
    user: UserResolver,
    listItems: ListItemsResolver,
    items: ListItemsConnectionResolver,
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
