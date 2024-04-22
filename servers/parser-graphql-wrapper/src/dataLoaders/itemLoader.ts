import DataLoader from 'dataloader';
import * as Sentry from '@sentry/node';

import { getItemResolverRepository } from '../datasources/mysql';
import config from '../config';
import {
  DataLoaderCacheInterface,
  batchCacheFn,
} from '@pocket-tools/apollo-utils';
import { serverLogger } from '@pocket-tools/ts-logger';
import { getRedisCache } from '../cache';
import { Item } from '../__generated__/resolvers-types';

export type ItemLoaderType = { itemId?: string; url?: string };

/**
 * Get items' URLs but their IDs
 * @param items ItemLoaderType
 */
export const batchGetItemUrlsByItemIds = async (
  itemIds: string[],
): Promise<ItemLoaderType[]> => {
  const itemResolverRepository = await getItemResolverRepository();

  const itemQueries = itemIds.map((itemId) => {
    return itemResolverRepository
      .getResolvedItemById(itemId)
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
        return { url: data.normalUrl, itemId: itemId };
      })
      .catch((error) => {
        const errorMessage =
          'batchGetItemUrlsByItemIds: Could not get item by ID.';
        const errorData = {
          itemIds: itemIds,
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
 * Batch get items by ids or urls
 * @param values
 * @param params
 */
export const batchGetItemUrls = async (
  values: string[],
  params: {
    key: 'itemId';
    getValueFn: (item: Item) => string;
    cache: DataLoaderCacheInterface;
  },
): Promise<ItemLoaderType[]> => {
  return await batchCacheFn<string, ItemLoaderType>({
    values: values,
    valueKeyFn: (value) => value,
    callback: batchGetItemUrlsByItemIds,
    cacheKeyPrefix: 'v2',
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
): Promise<ItemLoaderType[]> => {
  return await batchGetItemUrls(itemIds, {
    key: 'itemId',
    getValueFn: (item) => item.itemId,
    cache: getRedisCache(),
  });
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
