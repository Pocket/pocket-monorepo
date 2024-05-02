import { ErrorsAreMissesCache } from '@apollo/utils.keyvaluecache';
import { DataLoaderCacheInterface } from './interface.js';
import md5 from 'md5';

/**
 * This cache wraps a KeyValueCache and adds a function
 */
export class DataloaderKeyValueCache
  extends ErrorsAreMissesCache
  implements DataLoaderCacheInterface
{
  /**
   * Generates an md5 hashed cache key from key input
   * @param key
   * @returns key
   */
  getKey(key: string): string {
    return md5(key) as string;
  }
}
