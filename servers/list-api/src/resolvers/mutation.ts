import {
  SavedItem,
  SavedItemUpsertInput,
  TagUpdateInput,
  DeleteSavedItemTagsInput,
  SavedItemTagUpdateInput,
  SavedItemTagsInput,
  Tag,
  SavedItemRefInput,
} from '../types';
import { IContext } from '../server/context';
import { ParserCaller } from '../externalCaller/parserCaller';
import { SavedItemDataService } from '../dataService';
import * as Sentry from '@sentry/node';
import { EventType } from '../businessEvents';
import { getSavedItemTagsMap, atLeastOneOf } from './utils';
import { TagModel } from '../models';
import { serverLogger } from '@pocket-tools/ts-logger';
import { NotFoundError, UserInputError } from '@pocket-tools/apollo-utils';

/**
 * Create or re-add a saved item in a user's list.
 * Note that if the item already exists in a user's list, the item's 'favorite'
 * property will only be updated if 'SavedItemUpsertInput.isFavorite' == true.
 * To 'unfavorite' a SavedItem, use the updateSavedItemUnfavorite mutation instead.
 * TODO: Revisit this favorite behavior. Do clients actually use it?
 * (and more importantly do they *need* to use it?) Seems like a /v3 holdover.
 * @param _
 * @param args
 * @param context
 */
export async function upsertSavedItem(
  _,
  args,
  context: IContext,
): Promise<SavedItem> {
  const savedItemUpsertInput: SavedItemUpsertInput = args.input;
  const savedItemDataService = new SavedItemDataService(context);

  try {
    //TODO do we need the resolved id @Herraj
    let item = await ParserCaller.getOrCreateItem(savedItemUpsertInput.url);
    const existingItem = await savedItemDataService.getSavedItemById(
      item.itemId.toString(),
    );

    // if title is provided in the mutation input then use that and not the one received by the parser call
    if (savedItemUpsertInput.title) {
      item = { ...item, title: savedItemUpsertInput.title };
    }
    // Keep track of whether the request was originally to favorite an item,
    // and whether it's a new favorite or item was favorited already
    const shouldSendFavoriteEvent =
      savedItemUpsertInput.isFavorite && !existingItem?.isFavorite;
    // Don't unfavorite an existing favorited item
    if (existingItem != null && !savedItemUpsertInput.isFavorite) {
      savedItemUpsertInput.isFavorite = existingItem.isFavorite;
    }
    const upsertedItem = await savedItemDataService.upsertSavedItem(
      item,
      savedItemUpsertInput,
    );

    if (upsertedItem == undefined) {
      serverLogger.error('Could not save item', {
        url: savedItemUpsertInput.url,
      });
      Sentry.addBreadcrumb({
        message: `Saved url ${savedItemUpsertInput.url}`,
      });
      throw new Error(`unable to add an item`);
    }

    if (existingItem != null) {
      // was an update, not a new insert
      if (existingItem.isArchived) {
        context.emitItemEvent(EventType.UNARCHIVE_ITEM, upsertedItem);
      }
    } else {
      // Was a new add
      context.emitItemEvent(EventType.ADD_ITEM, upsertedItem);
    }
    if (shouldSendFavoriteEvent) {
      context.emitItemEvent(EventType.FAVORITE_ITEM, upsertedItem);
    }
    return upsertedItem;
  } catch (e) {
    serverLogger.error('unable to add item', {
      url: savedItemUpsertInput.url,
    });
    Sentry.addBreadcrumb({
      message: `unable to add item with url: ${savedItemUpsertInput.url}`,
    });
    Sentry.captureException(e);
    throw new Error(`unable to add item with url: ${savedItemUpsertInput.url}`);
  }
}

/**
 * Favorite a saved item
 * @param root
 * @param args
 * @param context
 */
export async function updateSavedItemFavorite(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  return context.models.savedItem.favoriteById(args.id, args.timestamp);
}

/**
 * Unfavorite a saved item
 * @param root
 * @param args
 * @param context
 */
export async function updateSavedItemUnFavorite(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  return context.models.savedItem.unfavoriteById(args.id, args.timestamp);
}

/**
 * Archive a saved item
 * @param root
 * @param args
 * @param context
 */
export async function updateSavedItemArchive(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  return context.models.savedItem.archiveById(args.id, args.timestamp);
}

/**
 * Unarchive a saved item
 * @param root
 * @param args
 * @param context
 */
export async function updateSavedItemUnArchive(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  return context.models.savedItem.unarchiveById(args.id, args.timestamp);
}

/**
 * Soft delete a saved item
 * @param root
 * @param args
 * @param context
 */
export async function deleteSavedItem(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<string> {
  return context.models.savedItem.deleteById(args.id, args.timestamp);
}

/**
 * Undelete a saved item
 * @param root
 * @param args
 * @param context
 */
export async function updateSavedItemUnDelete(
  root,
  args: { id: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  return context.models.savedItem.undeleteById(args.id, args.timestamp);
}

/**
 * Replaces existing tags association with the input tagIds for a given savedItemId
 * todo: check for savedItemId before proceeding.
 * @param root
 * @param args savedItemTagUpdateInput gets savedItemId and the input tagIds
 * @param context
 */
export async function updateSavedItemTags(
  root,
  args: { input: SavedItemTagUpdateInput; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  const savedItem = await context.models.tag.updateTagSaveConnections(
    args.input,
    args.timestamp,
  );
  context.emitItemEvent(
    EventType.REPLACE_TAGS,
    savedItem,
    args.input.tagIds.map((id) => TagModel.decodeId(id)),
  );
  return savedItem;
}

/**
 * deletes all the tags associated with the given savedItem id.
 * if the tag is associated only with the give itemId, then the tag
 * will be deleted too.
 * //todo: check for savedItemId before proceeding.
 * @param root
 * @param args savedItemId whose tags are to be removed.
 * @param context
 */
export async function updateSavedItemRemoveTags(
  root,
  args: { savedItemId: string; timestamp?: Date },
  context: IContext,
): Promise<SavedItem> {
  const { save, removed } = await context.models.tag.removeSaveTags(
    args.savedItemId,
    args.timestamp,
  );
  context.emitItemEvent(EventType.CLEAR_TAGS, save, removed);
  return save;
}

/**
 * Creates tags, savedItem and tag association for the given list of inputs.
 * Note: this mutation does not validate if the savedItem exist already.
 * @param root
 * @param args list of savedItemTagsInput.
 * @param context
 */
export async function createSavedItemTags(
  root,
  args: { input: SavedItemTagsInput[]; timestamp?: Date },
  context: IContext,
): Promise<SavedItem[]> {
  const savedItemTagsMap = getSavedItemTagsMap(args.input);
  const savedItems = await context.models.tag.createTagSaveConnections(
    args.input,
    args.timestamp,
  );

  for (const savedItem of savedItems) {
    context.emitItemEvent(
      EventType.ADD_TAGS,
      savedItem,
      savedItemTagsMap[savedItem.id],
    );
  }

  return savedItems;
}

/**
 * Mutation for untagging a saved item in a user's list.
 * Returns a list of SavedItem IDs to resolve
 */
export async function deleteSavedItemTags(
  root,
  args: { input: DeleteSavedItemTagsInput[]; timestamp?: Date },
  context: IContext,
): Promise<SavedItem[]> {
  const deleteOperations = await context.models.tag.deleteTagSaveConnection(
    args.input,
    args.timestamp,
  );
  const saves = deleteOperations.map(({ save, removed }) => {
    context.emitItemEvent(EventType.REMOVE_TAGS, save, removed);
    return save;
  });
  return saves;
}

/**
 * Mutation for deleting a tag entity. Removes all associations
 * between the deleted tag and SavedItems in the user's list.
 */
export async function deleteTag(
  root,
  args: { id: string },
  context: IContext,
): Promise<string> {
  return context.models.tag.deleteTag(args.id);
}

/**
 * Replaces all tags for a given saved item with the tags provided in the input
 * @param root
 * @param args
 * @param context
 */
export async function replaceSavedItemTags(
  root,
  args: { input: SavedItemTagsInput[]; timestamp?: Date },
  context: IContext,
): Promise<SavedItem[]> {
  const savedItemTagsMap = getSavedItemTagsMap(args.input);
  const savedItems = await context.models.tag.replaceSaveTagConnections(
    args.input,
    args.timestamp,
  );

  for (const savedItem of savedItems) {
    context.emitItemEvent(
      EventType.REPLACE_TAGS,
      savedItem,
      savedItemTagsMap[savedItem.id],
    );
  }
  return savedItems;
}

export async function updateTag(
  root,
  args: { input: TagUpdateInput },
  context: IContext,
): Promise<Tag> {
  return context.models.tag.renameTag(args.input);
}

/** Replace all tags on a single SavedItem with a new set of tags */
export async function replaceTags(
  root,
  args: { savedItem: SavedItemRefInput; tagNames: string[]; timestamp: Date },
  context: IContext,
): Promise<SavedItem> {
  if (!atLeastOneOf(args.savedItem, ['id', 'url'])) {
    throw new UserInputError('SavedItemRef must have one of `id` or `url`');
  }
  // Previously clients have used this to clear tags by passing an
  // empty replacement array, so reroute to clearTags mutation if
  // if the array of tagNames is empty
  if (args.tagNames.length === 0) {
    return clearTags(root, args, context);
  }
  let replacement: SavedItemTagsInput;
  if (args.savedItem.id != null) {
    replacement = { savedItemId: args.savedItem.id, tags: args.tagNames };
  } else {
    const id = await context.models.savedItem.fetchIdFromUrl(
      args.savedItem.url,
    );
    replacement = { savedItemId: id, tags: args.tagNames };
  }
  const savedItem = (
    await context.models.tag.replaceSaveTagConnections(
      [replacement],
      args.timestamp,
    )
  )[0];
  if (savedItem == null) {
    throw new NotFoundError(`SavedItem does not exist`);
  }
  context.emitItemEvent(EventType.REPLACE_TAGS, savedItem, args.tagNames);
  return savedItem;
}
/** Remove specific tags from a single SavedItem */
export async function removeTagsByName(
  root,
  args: { savedItem: SavedItemRefInput; tagNames: string[]; timestamp: Date },
  context: IContext,
): Promise<SavedItem> {
  if (!atLeastOneOf(args.savedItem, ['id', 'url'])) {
    throw new UserInputError('SavedItemRef must have one of `id` or `url`');
  }
  let updatedSave: SavedItem;
  if (args.savedItem.id != null) {
    updatedSave = await context.models.savedItem.removeTagsFromSaveById(
      args.savedItem.id,
      args.tagNames,
      args.timestamp,
    );
    console.log(JSON.stringify(updatedSave));
  } else {
    updatedSave = await context.models.savedItem.removeTagsFromSaveByUrl(
      args.savedItem.url,
      args.tagNames,
      args.timestamp,
    );
  }
  if (updatedSave == null) {
    throw new NotFoundError('SavedItem not found');
  }
  return updatedSave;
}
/** Remove all tags associated to a single SavedItem */
export async function clearTags(
  root,
  args: { savedItem: SavedItemRefInput; timestamp: Date },
  context: IContext,
): Promise<SavedItem> {
  if (!atLeastOneOf(args.savedItem, ['id', 'url'])) {
    throw new UserInputError('SavedItemRef must have one of `id` or `url`');
  }
  if (args.savedItem.id != null) {
    return context.models.savedItem.clearTagsById(
      args.savedItem.id,
      args.timestamp,
    );
  } else {
    return context.models.savedItem.clearTagsByUrl(
      args.savedItem.url,
      args.timestamp,
    );
  }
}
