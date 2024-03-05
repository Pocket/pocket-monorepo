import DataLoader from 'dataloader';
import * as Sentry from '@sentry/node';

import {
  ItemResolverRepository,
  getItemResolverRepository,
} from '../database/mysql';
import { Author, Image, Imageness, Item, Video, Videoness } from '../model';
import {
  extractDomainMeta,
  getAuthors,
  getImages,
  getVideos,
  normalizeDate,
} from '../parserApiUtils';
import config from '../config';
import {
  DataLoaderCacheInterface,
  batchCacheFn,
} from '@pocket-tools/apollo-utils';
import { FetchHandler } from '../fetch';
import { serverLogger } from '@pocket-tools/ts-logger';
import { getRedisCache } from '../cache';

/**
 * Gets an item by its id by using the Item Resolvers table
 * @param itemId
 * @param itemResolverRepository
 */
export const getItemById = async (
  itemId: string,
  itemResolverRepository: ItemResolverRepository,
): Promise<Item> => {
  const mysqlItem = await itemResolverRepository.getResolvedItemById(itemId);
  //For now we just hit the parser once we turn the resolved id into a url
  //Eventually we could bypass the parser and go to the database with async mysql calls for all the fields we need
  return getItemByUrl(mysqlItem.normalUrl, itemId);
};

/**
 * Gets an item from the Parser by it's url
 * @param url
 * @param itemId
 */
const internalGetItemByUrl = async (
  url: string,
  itemId?: string,
): Promise<Item> => {
  //Remove any leading space from the url.
  //Some clients are sending in data with a leading space causing a url not found
  url = url.trim();

  const endpoint = `${config.parserEndpoint}?url=${encodeURIComponent(
    url,
  )}&getItem=1&output=regular`;
  let data = await new FetchHandler().fetchJSON(endpoint);
  // check if there's an item
  if (!data || (data && !data.item)) {
    throw new Error(`No item found for URL: ${url}`);
  }

  // If the item resolves to 0, that means the item object is going to be empty and we need to refresh it cause of bad parser data..
  // Ideally we could instead look at fixing this logic in the Parser, but it's resolving code sometimes relies on URL and sometimes itemId
  if (data.item.resolved_id == '0') {
    data = await new FetchHandler().fetchJSON(`${endpoint}&refresh=true`);
    // check if there's an item
    if (!data || (data && !data.item)) {
      throw new Error(`No item found for URL: ${url}`);
    }
  }

  // get the item from the response
  const item = data.item;

  // validate the response has a given_url
  if (!item.given_url) {
    Sentry.captureException(
      new Error(
        `Item with item_id: ${item.item_id} does not have a given URL (given_url)`,
      ),
    );

    return null;
  }

  const authors: Author[] = Object.keys(item.authors || {}).length
    ? getAuthors(item.authors)
    : null;

  const images: Image[] = Object.keys(item.images || {}).length
    ? getImages(item.images)
    : null;

  const videos: Video[] = Object.keys(item.videos || {}).length
    ? getVideos(item.videos)
    : null;

  const domainMeta = extractDomainMeta(item);

  if (itemId && itemId !== item.item_id.toString()) {
    // Sometimes when we send urls to the parser it can return an entirely separate itemId from the one that was
    // originally passed into from apollo gateway,
    // however we end up re-ordering our responses based on the original item id the gateway passed to us,
    // so if that changes the gateway will end up returning null when there is indeed data to return
    // TL;DR itemids are not trustworthy.
    // Let's log as errors to capture more data about what is happening.
    const errorMessage = 'internalGetItemByUrl: Gateway itemId!=Parser itemId';
    const errorData = {
      gatewayItemId: itemId,
      item: item,
      parserItemId: item.item_id.toString(),
      url: url,
    };
    serverLogger.error(errorMessage, { data: errorData });
  }

  return {
    itemId: itemId ?? item.item_id.toString(),
    resolvedId: item.resolved_id.toString(),
    topImageUrl: item.top_image_url,
    topImage: item.top_image_url
      ? { url: item.top_image_url, src: item.top_image_url, imageId: '0' }
      : undefined,
    dateResolved: normalizeDate(item.date_resolved),
    normalUrl: item.normal_url,
    givenUrl: item.given_url,
    title: item.title,
    ampUrl: item.resolved_url,
    resolvedUrl: item.resolved_url,
    isArticle: !!parseInt(item.is_article),
    isIndex: !!parseInt(item.is_index),
    hasVideo: parseVideoness(item.has_video),
    hasImage: parseImageness(item.has_image),
    excerpt: item.excerpt,
    wordCount: item.word_count,
    timeToRead: item.time_to_read,
    images: images,
    videos: videos,
    authors: authors,
    mimeType: item.mime_type,
    encoding: item.encoding,
    domainMetadata: {
      name: domainMeta.name,
      logo: domainMeta.logo,
      logoGreyscale: domainMeta.greyscale_logo,
    },
    language: item.lang,
    datePublished: normalizeDate(item.date_published),
    hasOldDupes: !!parseInt(item.has_old_dupes),
    domainId: item.domain_id,
    originDomainId: item.origin_domain_id,
    responseCode: parseInt(item.response_code),
    contentLength: parseInt(item.content_length),
    innerDomainRedirect: !!parseInt(item.innerdomain_redirect),
    loginRequired: !!parseInt(item.login_required),
    usedFallback: !!parseInt(item.used_fallback),
    timeFirstParsed: normalizeDate(item.time_first_parsed),
    resolvedNormalUrl: item.resolved_normal_url,
  };
};

/**
 * Wrapper over getItemByUrl so we can retry due to parser flakeyness
 * @param url
 * @param itemId
 */
export const getItemByUrl = async (
  url: string,
  itemId?: string,
  tries = config.parserRetries,
): Promise<Item> => {
  let lastError = null;
  while (tries > 0) {
    try {
      return await internalGetItemByUrl(url, itemId);
    } catch (e) {
      lastError = e;
    }
    tries--;
  }

  Sentry.captureException(lastError);
  //Old function returned null instead of throwing.
  return null;
};

/**
 * Converts parser item.has_video to a graphql enum
 * @param hasVideo
 */
const parseVideoness = (hasVideo: string): Videoness => {
  switch (parseInt(hasVideo)) {
    case 0:
      return Videoness.NO_VIDEOS;
    case 1:
      return Videoness.HAS_VIDEOS;
    case 2:
      return Videoness.IS_VIDEO;
  }
};

/**
 * Converts parser item.has_image to a graphql enum
 * @param hasImage
 */
const parseImageness = (hasImage: string): Imageness => {
  switch (hasImage) {
    case '0':
      return Imageness.NO_IMAGES;
    case '1':
      return Imageness.HAS_IMAGES;
    case '2':
      return Imageness.IS_IMAGE;
  }
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
export const batchGetItemsByIds: any = async (
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
const createLoader = (batchLoadFn: DataLoader.BatchLoadFn<any, any>) => {
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
