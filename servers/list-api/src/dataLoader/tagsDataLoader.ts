import config from '../config';
import { IContext } from '../server/context';
import { reorderResultByKey } from './utils';
import { SavedItemDataService, TagDataService } from '../dataService';
import { Tag } from '../types';
import { TagModel } from '../models';
import DataLoader from 'dataloader';

/**
 * Create dataloaders to cache and batch requests for Tags made
 * in a single tick of the application.
 * There are three loaders for Tags.
 * 2 loaders differ by keys: one accesses Tag by ID, & the other by name.
 * The third loader accesses all Tags associated with an Item via the Item's ID.
 * The first 2 loaders fill the cache of the other when loading from either key
 * (since they refer to the same object, just via alternative keys).
 * That way resolving the same object by alternative key does not result
 * in duplicate fetches.
 * The third loader does not cache, as its primary use is query batching
 * in order to handle a n+1 problem when wanted all Tags for a list of Items.
 * @param context IContext object with database connection. Should
 * be freshly created for every GraphQL request.
 */
export function createTagDataLoaders(
  context: IContext,
): Pick<IContext['dataLoaders'], 'tagsById' | 'tagsByName' | 'tagsByItemId'> {
  const byIdLoader = new DataLoader(async (ids: string[]) => {
    const savedItemDataService = new SavedItemDataService(context);
    const tags = await batchGetTagsByIds(
      new TagDataService(context, savedItemDataService),
      ids,
    );
    tags.forEach((tag) => byNameLoader.prime(tag.name, tag));
    return tags;
  });
  const byNameLoader = new DataLoader(async (names: string[]) => {
    const savedItemDataService = new SavedItemDataService(context);
    const tags = await batchGetTagsByNames(
      new TagDataService(context, savedItemDataService),
      names,
    );
    tags.forEach((tag) => byIdLoader.prime(tag.id, tag));
    return tags;
  });
  const byItemIdLoader = new DataLoader(
    async (itemIds: string[]) => {
      const savedItemDataService = new SavedItemDataService(context);
      const tags = await batchGetTagsByItemIds(
        new TagDataService(context, savedItemDataService),
        itemIds,
      );
      return tags;
    },
    {
      cache: false,
      maxBatchSize: config.dataloaderDefaults.maxBatchSize,
    },
  );
  return {
    tagsById: byIdLoader,
    tagsByName: byNameLoader,
    tagsByItemId: byItemIdLoader,
  };
}

/**
 * Batch loader function to get tags by their ids.
 * @param tagDataService
 * @param ids list of Tag ids.
 */
export async function batchGetTagsByIds(
  tagDataService: TagDataService,
  ids: string[],
): Promise<Tag[]> {
  const names = ids.map(TagModel.decodeId);
  const tags: Tag[] = await batchGetTagsByNames(tagDataService, names);
  return reorderResultByKey<Tag, 'id'>({ key: 'id', values: ids }, tags);
}

/**
 * Batch loader function to get tags by their names.
 * @param tagDataService
 * @param names list of Tag names.
 */
export async function batchGetTagsByNames(
  tagDataService: TagDataService,
  names: string[],
): Promise<Tag[]> {
  const tags = await tagDataService.getTagsByName(names);
  return reorderResultByKey<Tag, 'name'>({ key: 'name', values: names }, tags);
}

/**
 * Batch loader function to get tags by their associated Items via Item IDs.
 * @param tagDataService
 * @param itemIds list of Item Ids
 */
export async function batchGetTagsByItemIds(
  tagDataService: TagDataService,
  itemIds: string[],
): Promise<Tag[][]> {
  // get tags from database for given PocketSave or SavedItem IDs.
  const saveTags = await tagDataService.batchGetTagsByUserItems(itemIds);
  // Return tag list per itemId in the original itemId order requested
  return itemIds.map((itemId) => saveTags[itemId] ?? []);
}
