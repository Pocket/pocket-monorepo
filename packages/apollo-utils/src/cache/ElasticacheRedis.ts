import md5 from 'md5';
import { KeyValueCacheSetOptions } from '@apollo/utils.keyvaluecache';
import { Redis } from 'ioredis';
import { CacheInterface } from './interface';

/**
 * Backwards compatibility wrapper around ioredis for `parser-graphql-wrapper`.
 * This class allows us to use Elasticache Redis's primary and reader endpoints for caching
 *
 * This is not going away immediately, but really should not be used anymore
 * outside `parser-graphql-wrapper`. The shared cache there utilizes mget and mset,
 * so this is being preserved to avoid major refactoring there. This will be
 * removed when that service is deprecated (new parser).
 *
 * For all other services, use Keyv and KeyvAdapter with the Redis Sentinel
 * config documented here going forward:
 * https://www.apollographql.com/docs/apollo-server/performance/cache-backends/#redis-sentinel
 * @deprecated
 */
export class ElasticacheRedis implements CacheInterface {
  /**
   * Constructs a RedisCache instance for the primary and reader endpoints
   * @param primaryClient
   * @param readerClient
   */
  constructor(
    private primaryClient: Redis,
    private readerClient: Redis,
  ) {}

  /**
   * Generates an md5 hashed cache key from key input
   * @param key
   */
  getKey(key: string): string {
    return md5(key) as string;
  }

  /**
   * Sets a single value to cache
   * @param key
   * @param value
   * @param options
   */
  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions,
  ): Promise<void> {
    // this default replicates the behavior of the deprecated
    // RedisClient from 'apollo-server-cache-redis'
    const ttl = options?.ttl ?? 300;
    if (typeof ttl === 'number') {
      await this.primaryClient.set(key, value, 'EX', options.ttl);
    } else {
      await this.primaryClient.set(key, value);
    }
  }

  /**
   * Sets multiple values to cache
   * @param keyValues
   * @param ttl
   */
  async mset(keyValues: { [key: string]: string }, ttl: number): Promise<void> {
    // ioredis does not support setting a ttl with mset
    // See https://github.com/luin/ioredis/issues/1133.
    // So we map the key-values into an array of redis commands and execute it.
    const setCommands = Object.keys(keyValues).map((key) => {
      return ['set', key, keyValues[key], 'ex', ttl];
    });

    await this.primaryClient.multi(setCommands).exec();
  }

  /**
   * Gets a single value from cache using the key
   * @param key
   */
  async get(key: string): Promise<string | undefined> {
    return this.readerClient.get(key);
  }

  /**
   * Gets multiple values from cache
   * @param keys
   */
  async mget(keys: string[]): Promise<string[]> {
    return this.readerClient.mget(...keys);
  }

  /**
   * Deletes a value from cache using the key
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    return (await this.primaryClient.del(key)) > 0;
  }

  /**
   * Flushes the cache, this removes all values from cache
   */
  async flush(): Promise<void> {
    await this.primaryClient.flushdb();
  }

  /**
   * Closes the connection to the cache
   */
  async close(): Promise<void> {
    await Promise.all([this.primaryClient.quit(), this.readerClient.quit()]);
  }

  /**
   * Flushes the cache
   */
  async clear(): Promise<void> {
    await this.flush();
  }
}
