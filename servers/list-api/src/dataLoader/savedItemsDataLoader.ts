import DataLoader from 'dataloader';
import { SavedItemDataService } from '../dataService';
import { IContext } from '../server/context';
import { SavedItem } from '../types';
import { reorderResultByKey } from './utils';

/**
 * Batch loader function to get saved items by URLs
 * @param context
 * @param urls
 */
export async function batchGetSavedItemsByUrls(
  savedItemService: SavedItemDataService,
  urls: string[],
): Promise<(SavedItem | undefined)[]> {
  const savedItems: SavedItem[] =
    await savedItemService.batchGetSavedItemsByGivenUrls(urls);

  //deleted items or non-existent should be returned in this list
  //as <url, undefined>
  //if we skip deleted urls, then dataloader throws error at resolver
  return reorderResultByKey<SavedItem, 'url'>(
    { key: 'url', values: urls },
    savedItems,
  );
}

/**
 * Batch loader function to get savedItems by id.
 * @param context
 * @param ids list of savedItem ids.
 */
export async function batchGetSavedItemsByIds(
  savedItemService: SavedItemDataService,
  ids: string[],
): Promise<(SavedItem | undefined)[]> {
  const savedItems: SavedItem[] =
    await savedItemService.batchGetSavedItemsByGivenIds(ids);

  //deleted items or non-existent should be returned in this list
  //as <id, undefined>
  //if we skip deletedIds, then dataloader throws error at resolver
  return reorderResultByKey<SavedItem, 'id'>(
    { key: 'id', values: ids },
    savedItems,
  );
}

/**
 * Create dataloaders to cache and batch requests for SavedItem made
 * in a single tick of the application.
 * There are two loaders for SavedItems which are differentiated by
 * keys: one accesses the SavedItem by ID, and one by URL. Each loader
 * fills the cache of the other when loading from either key (since they
 * refer to the same object, just via alternative keys).
 * That way resolving the same object by alternative key does not result
 * in duplicate fetches.
 * @param context IContext object with database connection. Should
 * be freshly created for every GraphQL request.
 */
export function createSavedItemDataLoaders(
  context: IContext,
): Pick<IContext['dataLoaders'], 'savedItemsById' | 'savedItemsByUrl'> {
  const byIdLoader = new DataLoader(async (ids: string[]) => {
    const items = await batchGetSavedItemsByIds(
      new SavedItemDataService(context),
      ids,
    );
    items.forEach((item) => {
      if (item) {
        byUrlLoader.prime(item.url, item);
      }
    });
    return items;
  });
  const byUrlLoader = new DataLoader(async (urls: string[]) => {
    const items = await batchGetSavedItemsByUrls(
      new SavedItemDataService(context),
      urls,
    );
    items.forEach((item) => {
      if (item) {
        byIdLoader.prime(item.id, item);
      }
    });
    return items;
  });
  return { savedItemsById: byIdLoader, savedItemsByUrl: byUrlLoader };
}
