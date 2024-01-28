// this is the entry point for the npm package
// anything we want consumable (module, type, class, etc) should be exported here
export * from './cache/ElasticacheRedis';
export * from './cache/interface';
export * from './dataloader';
export * from './errorHandler/errorHandler';
export * from './isoStringScalar/isoStringScalar';
export * from './pagination/';
export * from './sentry/apolloSentryPlugin';
export * from './plugins/defaultPlugin';
export * from './express/sentryMiddleware';
export * from './utils';

// export a generic object with all Pocket Custom Scalars
import { isoStringScalar } from './isoStringScalar/isoStringScalar';

export const PocketDefaultScalars = {
  ISOString: isoStringScalar,
};
