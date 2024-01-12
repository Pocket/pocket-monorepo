import Keyv from 'keyv';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { ErrorsAreMissesCache } from '@apollo/utils.keyvaluecache';
import config from '../config';
import { serverLogger } from '../express';

/**
 * Sets up the connection to the Redis cluster. ErrorsAreMissesCache wrapper provides error tolerance for cache backends.
 * If the cache is unavailable and the request throws an error, ErrorsAreMissesCache treats that error as a cache miss.
 */
export function getRedisCache() {
  const keyv = new Keyv(
    `redis://${config.redis.primaryEndpoint}:${config.redis.port}`
  ).on('error', function (message) {
    serverLogger.error({
      data: {},
      error: message,
      message: `getRedisCache: Redis cache error.`,
    });
  });
  const cache = new ErrorsAreMissesCache(new KeyvAdapter(keyv));
  return cache;
}
