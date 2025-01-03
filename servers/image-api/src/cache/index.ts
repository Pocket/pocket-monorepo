import Keyv from 'keyv';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import config from '../config';
import { serverLogger } from '@pocket-tools/ts-logger';
import {
  DataLoaderCacheInterface,
  DataloaderKeyValueCache,
} from '@pocket-tools/apollo-utils';
import KeyvRedis from '@keyv/redis';

let cache: DataloaderKeyValueCache | null = null;
let redis: Keyv | null = null;

/**
 * Sets up the connection to the Redis cluster. ErrorsAreMissesCache wrapper provides error tolerance for cache backends.
 * If the cache is unavailable and the request throws an error, ErrorsAreMissesCache treats that error as a cache miss.
 * (Note, dataLoaderkeyvalue cache extends errors are misses cache)
 */
export function getRedisCache(): DataLoaderCacheInterface {
  if (cache) {
    return cache;
  }
  cache = new DataloaderKeyValueCache(new KeyvAdapter(getRedis()));
  return cache;
}

export function getRedis(): Keyv {
  if (redis) {
    return redis;
  }

  const keyvRedis = new KeyvRedis(
    `${config.redis.isTLS ? 'rediss' : 'redis'}://${config.redis.primaryEndpoint}:${config.redis.port}`,
    { isCluster: config.redis.isCluster, useRedisSets: false },
  );
  redis = new Keyv({
    store: keyvRedis,
    isCluster: config.redis.isCluster,
  }).on('error', function (message) {
    serverLogger.error({
      error: message,
      message: `getRedisCache: Redis cache error.`,
    });
  });
  return redis;
}
