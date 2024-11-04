import { PocketEventType } from './events';
import {
  ForgotPasswordRequest,
  AccountDelete,
  AccountEmailUpdated,
  PremiumPurchaseEvent,
  AccountRegistration,
  ExportReady,
  AddItem,
  ExportRequested,
  DeleteItem,
  FavoriteItem,
  UnfavoriteItem,
  ArchiveItem,
  UnarchiveItem,
  AddTags,
  ReplaceTags,
  ClearTags,
  RemoveTags,
  RenameTag,
  DeleteTag,
  UpdateTitle,
} from './types';
export * from './types';
export * from './events';

export type PocketEvent =
  | ForgotPasswordRequest
  | AccountDelete
  | AccountEmailUpdated
  | AccountRegistration
  | ExportReady
  | ExportRequested
  | PremiumPurchaseEvent
  | AddItem
  | DeleteItem
  | FavoriteItem
  | UnfavoriteItem
  | ArchiveItem
  | UnarchiveItem
  | AddTags
  | ReplaceTags
  | ClearTags
  | RemoveTags
  | RenameTag
  | DeleteTag
  | UpdateTitle;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
  [PocketEventType.ACCOUNT_DELETION]: AccountDelete;
  [PocketEventType.ACCOUNT_EMAIL_UPDATED]: AccountEmailUpdated;
  [PocketEventType.ACCOUNT_REGISTRATION]: AccountRegistration;
  [PocketEventType.PREMIUM_PURCHASE]: PremiumPurchaseEvent;
  [PocketEventType.EXPORT_READY]: ExportReady;
  [PocketEventType.EXPORT_REQUESTED]: ExportRequested;
  [PocketEventType.ADD_ITEM]: AddItem;
  [PocketEventType.DELETE_ITEM]: DeleteItem;
  [PocketEventType.FAVORITE_ITEM]: FavoriteItem;
  [PocketEventType.UNFAVORITE_ITEM]: UnfavoriteItem;
  [PocketEventType.ARCHIVE_ITEM]: ArchiveItem;
  [PocketEventType.UNARCHIVE_ITEM]: UnarchiveItem;
  [PocketEventType.ADD_TAGS]: AddTags;
  [PocketEventType.REPLACE_TAGS]: ReplaceTags;
  [PocketEventType.CLEAR_TAGS]: ClearTags;
  [PocketEventType.REMOVE_TAGS]: RemoveTags;
  [PocketEventType.RENAME_TAG]: RenameTag;
  [PocketEventType.DELETE_TAG]: DeleteTag;
  [PocketEventType.UPDATE_TITLE]: UpdateTitle;
};
