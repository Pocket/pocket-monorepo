import DataLoader from 'dataloader';

import config from '../config/index.js';
import {
  DataLoaderCacheInterface,
  batchCacheFn,
} from '@pocket-tools/apollo-utils';
import { getRedisCache } from '../cache/index.js';
import { Item } from '../__generated__/resolvers-types.js';
import { conn, resolvedItemsByItemIds } from '../databases/readitlab.js';

export type ItemLoaderType = { itemId?: string; url?: string };

/**
 * Get items' URLs but their IDs
 * @param items ItemLoaderType
 */
export const batchGetItemUrlsByItemIds = async (
  itemIds: string[],
): Promise<ItemLoaderType[]> => {
  const intItemIds = itemIds.map((itemId) => {
    return parseInt(itemId);
  });
  const items = await resolvedItemsByItemIds(conn(), intItemIds);
  return items.map((item) => {
    return item
      ? { url: item.normal_url, itemId: item.item_id.toFixed(0) }
      : null;
  });
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
