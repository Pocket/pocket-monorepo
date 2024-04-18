import DataLoader from 'dataloader';
import * as Sentry from '@sentry/node';

import {
  ItemResolverRepository,
  getItemResolverRepository,
} from '../datasources/mysql';
import config from '../config';
import {
  DataLoaderCacheInterface,
  batchCacheFn,
} from '@pocket-tools/apollo-utils';
import { serverLogger } from '@pocket-tools/ts-logger';
import { getRedisCache } from '../cache';
import { Item } from '../__generated__/resolvers-types';
import { ParserAPI } from '../datasources/ParserAPI';

/**
 * Gets an item by its id by using the Item Resolvers table
 * @param itemId
 * @param itemResolverRepository
 */
export const getItemById = async (
  itemId: string,
  itemResolverRepository: ItemResolverRepository,
  parserApi: ParserAPI,
): Promise<Item> => {
  const mysqlItem = await itemResolverRepository.getResolvedItemById(itemId);
  //For now we just hit the parser once we turn the resolved id into a url
  //Eventually we could bypass the parser and go to the database with async mysql calls for all the fields we need
  return parserApi.getItemData(mysqlItem.normalUrl);
};

export type ItemLoaderType = { itemId?: string; url?: string };

/**
 * Get items' URLs but their IDs
 * @param items ItemLoaderType
 */
export const batchGetItemUrlsByItemIds = async (
  items: ItemLoaderType[],
): Promise<ItemLoaderType[]> => {
  const itemResolverRepository = await getItemResolverRepository();

  const itemQueries = items.map((item) => {
    return itemResolverRepository
      .getResolvedItemById(item.itemId)
      .then((data) => {
        if (!data.normalUrl) return null;
        /*
        Not ideal, but we have to return normalUrl as the given URL here
        because the Parser tables do not ever store a givenUrl those are only
        stored on the list. itemIds are not actually 1:1 with givenUrl and are
        instead 1:1 with a normalUrl which is thrown through a cleaner.

        https://github.com/Pocket/Parser/blob/1b956865f90daa3d1f5996e1e77a09426a6c6e68/shared/includes/functions_shared.php#L113

        Ideally we should not access items by ItemId and instead always resolve
        using a URL and mark the itemId fetch method as deprecated.
        */
        return { url: data.normalUrl, itemId: item.itemId };
      })
      .catch((error) => {
        const errorMessage =
          'batchGetItemUrlsByItemIds: Could not get item by ID.';
        const errorData = {
          item: item,
        };
        serverLogger.error(errorMessage, { error: error, data: errorData });
        Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
        Sentry.captureException(error);
        return null;
      });
  });

  return await Promise.all(itemQueries);
};

/**
 * Grabs all items from
 * @param items
 */
export const batchGetItemsByItemUrls = async (
  items: ItemLoaderType[],
): Promise<any> => {
  const resolvedItems = items.map((item) => {
    if (!item) {
      return null;
    }

    return getItemByUrl(item.url, item.itemId).catch((error) => {
      const errorMessage =
        'batchGetItemsByItemUrls: Could not get item by URL.';
      const errorData = {
        item: item,
      };
      serverLogger.error(errorMessage, { error: error, data: errorData });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      Sentry.captureException(error);
      return null;
    });
  });

  return await Promise.all(resolvedItems);
};

/**
 * Batch get items by ids or urls
 * @param values
 * @param params
 */
export const batchGetItems = async (
  values: ItemLoaderType[],
  params: {
    key: 'itemId' | 'givenUrl';
    getValueFn: (item: Item) => string;
    cache: DataLoaderCacheInterface;
  },
): Promise<Item[]> => {
  let callback;

  if (params.key === 'itemId') {
    callback = async (values) => {
      values = await batchGetItemUrlsByItemIds(values);
      return batchGetItemsByItemUrls(values);
    };
  } else {
    callback = batchGetItemsByItemUrls;
  }

  return await batchCacheFn<ItemLoaderType, Item>({
    values: values,
    valueKeyFn: (value) => (params.key === 'itemId' ? value.itemId : value.url),
    callback,
    cache: params.cache,
    returnTypeKeyFn: params.getValueFn,
    maxAge: config.app.defaultMaxAge,
  });
};

/**
 * Batch get items by ids
 * @param itemIds
 */
export const batchGetItemsByIds = async (
  itemIds: string[],
): Promise<Item[]> => {
  return await batchGetItems(
    itemIds.map((id) => ({ itemId: id })),
    {
      key: 'itemId',
      getValueFn: (item) => item.itemId,
      cache: getRedisCache(),
    },
  );
};

/**
 * Batch get items by urls
 * @param itemUrls
 */
export const batchGetItemsByUrls = async (
  itemUrls: string[],
): Promise<Item[]> => {
  return await batchGetItems(
    itemUrls.map((url) => ({ url })),
    {
      key: 'givenUrl',
      getValueFn: (item) => item.givenUrl,
      cache: getRedisCache(),
    },
  );
};

export const clear = (options: {
  itemId?: string;
  givenUrl?: string;
  resolvedItemId?: string;
  resolvedUrl?: string;
}) => {
  const cache = getRedisCache();

  if (options.itemId) {
    cache.delete(cache.getKey(options.itemId));
  }

  if (options.resolvedItemId) {
    cache.delete(cache.getKey(options.resolvedItemId));
  }

  if (options.givenUrl) {
    cache.delete(cache.getKey(options.givenUrl));
  }

  if (options.resolvedItemId) {
    cache.delete(cache.getKey(options.resolvedItemId));
  }
};

/**
 * Create a data loader to batch requests
 * @param batchLoadFn
 */
const createLoader = <T, K>(batchLoadFn: DataLoader.BatchLoadFn<T, K>) => {
  return new DataLoader(batchLoadFn, {
    cache: false,
  });
};

/**
 * Item itemId loader
 */
export const itemIdLoader = createLoader(batchGetItemsByIds);

/**
 * Item givenUrl loader
 */
export const itemUrlLoader = createLoader(batchGetItemsByUrls);
