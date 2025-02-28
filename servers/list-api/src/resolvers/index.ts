import {
  savedItemById,
  savedItems,
  savedItemsPage,
  tags as userTags,
} from './user';
import { item, suggestedTags as savedItemSuggestedTags } from './savedItem';
import {
  clearTags,
  createSavedItemTags,
  deleteSavedItem,
  deleteSavedItemTags,
  deleteTag,
  removeTagsByName,
  replaceSavedItemTags,
  replaceTags,
  updateSavedItemArchive,
  updateSavedItemFavorite,
  updateSavedItemRemoveTags,
  updateSavedItemTags,
  updateSavedItemUnArchive,
  updateSavedItemUnDelete,
  updateSavedItemUnFavorite,
  updateTag,
  upsertSavedItem,
  exportList,
  batchImport,
  importUploadUrl,
  exportData,
} from './mutation';
import { tagsSavedItems } from './tag';
import {
  BaseError,
  ExportAcknowledgment,
  ExportDisabled,
  Item,
  NotFound,
  PendingItem,
  PocketSave,
  SaveByIdResult,
  SaveMutationInput,
  SaveUpdateTagsInputGraphql,
  SaveWriteMutationPayload,
  SavedItem,
  SavedItemTagInput,
  Tag,
} from '../types';
import { IContext } from '../server/context';
import { PocketDefaultScalars } from '@pocket-tools/apollo-utils';
import { GraphQLResolveInfo } from 'graphql';
import { itemIdFromSlug } from '@pocket-tools/int-mask';

const resolvers = {
  ...PocketDefaultScalars,
  BaseError: {
    __resolveType(parent: BaseError) {
      return parent.__typename;
    },
  },
  ItemResult: {
    __resolveType(parent: PendingItem | Item) {
      return parent.__typename;
    },
  },
  SaveByIdResult: {
    __resolveType(parent: PocketSave | NotFound) {
      return parent.__typename;
    },
  },
  ExportResponse: {
    __resolveType(parent: ExportAcknowledgment | ExportDisabled) {
      return parent.__typename;
    },
  },
  User: {
    saveById(
      _parent: any,
      args: any,
      context: IContext,
    ): Promise<SaveByIdResult[]> {
      return context.models.pocketSave.getById(args.ids);
    },
    savedItemById,
    savedItems,
    savedItemsByOffset: savedItemsPage,
    tags: userTags,
    async tagsList(
      _,
      args: { syncSince?: Date },
      context: IContext,
    ): Promise<string[] | undefined> {
      return await context.models.tag.tagsList(args.syncSince);
    },
  },
  Item: {
    savedItem: async (item: Item, args, context: IContext) => {
      return await context.dataLoaders.savedItemsByUrl.load(item.givenUrl);
    },
    // This is basically a passthrough so that the givenUrl is available
    // on the parent when the savedItem entity is resolved
    // Possible to resolve savedItem on this reference resolver instead,
    // but this maintains our pattern of separation of entity resolvers
    // If other scalar fields were resolved by list on Item, they'd go here
    __resolveReference: async (item: Item, context: IContext) => {
      return item;
    },
  },
  CorpusItem: {
    savedItem: async ({ url }, args, context: IContext) => {
      return await context.dataLoaders.savedItemsByUrl.load(url);
    },
  },
  PocketSave: {
    suggestedTags(parent: PocketSave, _args: any, context: IContext) {
      return context.models.tag.getSuggestedBySaveId(parent);
    },
    // using dataloader here for tags to avoid n+1 problem
    // e.g. avoid new db connection & query per item for tags
    tags(parent: PocketSave, _args: any, context: IContext): Promise<Tag[]> {
      return context.dataLoaders.tagsByItemId.load(parent.id);
    },
    item(parent: PocketSave, _args: any, context: IContext) {
      return context.models.item.getBySave(parent);
    },
  },
  SavedItem: {
    async tags(
      parent: SavedItem,
      _args: any,
      context: IContext,
    ): Promise<Tag[]> {
      const tags = await context.dataLoaders.tagsByItemId.load(parent.id);
      return tags;
    },
    suggestedTags: savedItemSuggestedTags,
    item,
    __resolveReference: async (savedItem, context: IContext) => {
      if (savedItem.id) {
        return await context.dataLoaders.savedItemsById.load(savedItem.id);
      } else {
        return await context.dataLoaders.savedItemsByUrl.load(savedItem.url);
      }
    },
  },
  ReaderViewResult: {
    async savedItem(
      parent: { slug: string },
      _,
      context: IContext,
    ): Promise<SavedItem | null> {
      const id = itemIdFromSlug(parent.slug);
      return await context.dataLoaders.savedItemsById.load(id);
    },
  },
  Tag: {
    savedItems: tagsSavedItems,
    // ID isn't modeled in the DB
    // Use resolvers to separate this from data layer logic
    id: (parent: Tag, _, context: IContext) => {
      return context.models.tag.resolveId(parent);
    },
  },
  ImportUploadResponse: {
    __resolveType(obj: any) {
      if (obj.url) {
        return 'PreSignedUrl';
      } else {
        return 'ImportLimited';
      }
    },
  },
  Mutation: {
    upsertSavedItem,
    updateSavedItemFavorite,
    updateSavedItemUnFavorite,
    updateSavedItemArchive,
    updateSavedItemUnArchive,
    deleteSavedItem,
    updateSavedItemUnDelete,
    updateSavedItemTags,
    updateSavedItemRemoveTags,
    updateTag,
    deleteSavedItemTags,
    deleteTag,
    createSavedItemTags,
    replaceSavedItemTags,
    clearTags,
    replaceTags,
    removeTagsByName,
    exportList,
    exportData,
    batchImport,
    importUploadUrl,
    deleteTagByName: async (
      _,
      args: { tagName: string; timestamp?: Date },
      context: IContext,
    ): Promise<string> => {
      return await context.models.tag.deleteTagByName(
        args.tagName,
        args.timestamp,
      );
    },
    saveArchive: async (
      _,
      args: SaveMutationInput,
      context: IContext,
      info: GraphQLResolveInfo,
    ): Promise<SaveWriteMutationPayload> => {
      return await context.models.pocketSave.saveArchive(
        args.id,
        args.timestamp,
        info.path,
      );
    },
    saveUnArchive: async (
      _,
      args: SaveMutationInput,
      context: IContext,
      info: GraphQLResolveInfo,
    ): Promise<SaveWriteMutationPayload> => {
      return await context.models.pocketSave.saveUnArchive(
        args.id,
        args.timestamp,
        info.path,
      );
    },
    saveFavorite: async (
      _,
      args: SaveMutationInput,
      context: IContext,
      info: GraphQLResolveInfo,
    ): Promise<SaveWriteMutationPayload> => {
      return await context.models.pocketSave.saveFavorite(
        args.id,
        args.timestamp,
        info.path,
      );
    },
    saveUnFavorite: async (
      _,
      args: SaveMutationInput,
      context: IContext,
      info: GraphQLResolveInfo,
    ): Promise<SaveWriteMutationPayload> => {
      return await context.models.pocketSave.saveUnFavorite(
        args.id,
        args.timestamp,
        info.path,
      );
    },
    saveBatchUpdateTags: async (
      _,
      args: { input: SaveUpdateTagsInputGraphql[]; timestamp: Date },
      context: IContext,
      info: GraphQLResolveInfo,
    ): Promise<SaveWriteMutationPayload> => {
      return await context.models.tag.batchUpdateTagConnections(
        args.input,
        args.timestamp,
        info.path,
      );
    },
    saveUpsert: (
      _,
      args,
      context: IContext,
      info: GraphQLResolveInfo,
    ): null => {
      //TODO @Herraj --> implementation in a follow up PR
      return null;
    },
    savedItemTag: async (
      _,
      args: { input: SavedItemTagInput; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.tag.createSavedItemTagConnections(
        args.input,
        args.timestamp,
      );
    },
    savedItemArchive: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.archiveByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemUnArchive: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.unarchiveByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemFavorite: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.favoriteByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemUnFavorite: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.unfavoriteByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemDelete: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<string | null> => {
      return await context.models.savedItem.deleteByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemUnDelete: async (
      _,
      args: { givenUrl: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.undeleteByUrl(
        args.givenUrl,
        args.timestamp,
      );
    },
    savedItemUpdateTitle: async (
      _,
      args: { givenUrl: string; timestamp: Date; title: string },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.updateTitleByUrl(
        args.givenUrl,
        args.timestamp,
        args.title,
      );
    },
    updateSavedItemTitle: async (
      _,
      args: { id: string; timestamp: Date; title: string },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.updateTitleById(
        args.id,
        args.timestamp,
        args.title,
      );
    },
    renameTagByName: async (
      _,
      args: { oldName: string; newName: string; timestamp?: Date },
      context: IContext,
    ): Promise<Tag | null> => {
      return await context.models.tag.renameTagByName(
        args.oldName,
        args.newName,
        args.timestamp,
      );
    },
    reAddById: async (
      _,
      args: { id: string; timestamp: Date },
      context: IContext,
    ): Promise<SavedItem | null> => {
      return await context.models.savedItem.reAdd(args.id, args.timestamp);
    },
  },
};

export { resolvers };
