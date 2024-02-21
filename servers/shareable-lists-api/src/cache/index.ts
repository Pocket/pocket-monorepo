import Keyv from 'keyv';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { ErrorsAreMissesCache } from '@apollo/utils.keyvaluecache';
import config from '../config';
import { serverLogger } from '@pocket-tools/ts-logger';
import KeyvRedis from '@keyv/redis';

let redis: Keyv = undefined;
let cache: ErrorsAreMissesCache = undefined;

/**
 * Sets up the connection to the Redis cluster. ErrorsAreMissesCache wrapper provides error tolerance for cache backends.
 * If the cache is unavailable and the request throws an error, ErrorsAreMissesCache treats that error as a cache miss.
 */
export function getRedisCache() {
  if (cache) {
    return cache;
  }
  cache = new ErrorsAreMissesCache(new KeyvAdapter(getRedis()));
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
      data: {},
      error: message,
      message: `getRedisCache: Redis cache error.`,
    });
  });
  return redis;
}
