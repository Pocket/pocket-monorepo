import {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from '@apollo/utils.keyvaluecache';

export interface MsetKeyValues {
  [key: string]: string;
}

export type { KeyValueCacheSetOptions };

export interface DataLoaderCacheInterface extends KeyValueCache {
  /**
   * Generates a cache key from key input
   * @param key
   */
  getKey(key: string): string;
}
