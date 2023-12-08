import { ElasticacheRedis } from '@pocket-tools/apollo-utils';
import { RedisCache } from 'apollo-server-cache-redis';
import config from '../config';

let redis = undefined;

export const getRedisCache = (): ElasticacheRedis => {
  if (redis) {
    return redis;
  }

  redis = new ElasticacheRedis(
    new RedisCache({
      host: config.redis.primaryEndpoint.split(':')[0],
      port: config.redis.port,
    }),
    new RedisCache({
      host: config.redis.readerEndpoint.split(':')[0],
      port: config.redis.port,
    }),
  );

  return redis;
};
