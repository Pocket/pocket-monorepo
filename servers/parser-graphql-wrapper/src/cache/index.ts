import Keyv from 'keyv';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { ErrorsAreMissesCache } from '@apollo/utils.keyvaluecache';
import config from '../config';
import { ElasticacheRedis } from '@pocket-tools/apollo-utils';
import { Redis } from 'ioredis';
import { serverLogger } from '../logger';

let cache: ErrorsAreMissesCache = undefined;
let redis: Keyv = undefined;
let elasticacheRedis: ElasticacheRedis = undefined;

// Note this file contains 3 cache defintions all connecting to the same redis.
// This is because Apollo updated their cache interface and we need to go back and refactor our other interfaces.
// Leaving this for future us to settle on a pattern.

/**
 * Sets up the connection to the Redis cluster. ErrorsAreMissesCache wrapper provides error tolerance for cache backends.
 * If the cache is unavailable and the request throws an error, ErrorsAreMissesCache treats that error as a cache miss.
 */
export function getRedisCache(): ErrorsAreMissesCache {
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
  redis = new Keyv(
    `redis://${config.redis.primaryEndpoint}:${config.redis.port}`,
  ).on('error', function (message) {
    serverLogger.error({
      data: {},
      error: message,
      message: `getRedisCache: Redis cache error.`,
    });
  });
  return redis;
}

export function getElasticacheRedis(): ElasticacheRedis {
  if (elasticacheRedis) {
    return elasticacheRedis;
  }

  elasticacheRedis = new ElasticacheRedis(
    new Redis({
      host: config.redis.primaryEndpoint.split(':')[0],
      port: parseInt(config.redis.port),
    }),
    new Redis({
      host: config.redis.readerEndpoint.split(':')[0],
      port: parseInt(config.redis.port),
    }),
  );
  return elasticacheRedis;
}
