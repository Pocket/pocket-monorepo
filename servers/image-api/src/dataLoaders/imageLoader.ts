import DataLoader from 'dataloader';
import { IContext } from '../server/context.js';
import { Image } from '../types/index.js';
import { batchCacheFn } from '@pocket-tools/apollo-utils';
import { getRedisCache } from '../cache/index.js';
import config from '../config/index.js';
import { getImageMetadata } from '../pocketImageCache/metadata.js';

/**
 * Grabs all source image values, first grabbing from the redis cache
 * @param urls
 */
export const batchFetchURLs = async (urls: string[]): Promise<Image[]> => {
  return batchCacheFn<string, Image>({
    values: urls,
    valueKeyFn: (url: string) => url, // same return value as cacheKeyFn
    callback: (values: string[]): Promise<Image[]> => {
      const promises = values.map((url: string) => getImageMetadata(url));
      return Promise.all(promises);
    },
    cache: getRedisCache(), // primary and reader
    cacheKeyPrefix: 'image-data-', // optional
    returnTypeKeyFn: (image: Image) => image.url, // same return value as valueFn
    maxAge: config.app.dataloaderCacheAge,
  });
};

/**
 * Create our data loader
 * @param context
 * @returns
 */
export function createImageDataLoaders(
  context: IContext,
): Pick<IContext['dataLoaders'], 'imagesByUrl'> {
  /**
   * Loader to batch requests
   */
  const byUrlLoader = new DataLoader(batchFetchURLs, {
    cache: true,
  });
  return { imagesByUrl: byUrlLoader };
}
