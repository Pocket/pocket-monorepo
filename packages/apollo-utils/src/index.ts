// this is the entry point for the npm package
// anything we want consumable (module, type, class, etc) should be exported here
export * from './cache/DataloaderKeyValueCache';
export * from './cache/interface';
export * from './dataloader';
export * from './errorHandler/errorHandler';
export * from './scalars';
export * from './pagination/';
export * from './plugins/defaultPlugin';
export * from './sentry/expressSentryMiddleware';
export * from './utils';
export * from './context';

// export a generic object with all Pocket Custom Scalars
import { GraphQLValidUrl, isoStringScalar } from './scalars';

export const PocketDefaultScalars = {
  ISOString: isoStringScalar,
  ValidUrl: GraphQLValidUrl,
};
