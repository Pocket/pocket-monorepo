// this is the entry point for the npm package
// anything we want consumable (module, type, class, etc) should be exported here
export * from './cache/DataloaderKeyValueCache.ts';
export * from './cache/interface.ts';
export * from './dataloader.ts';
export * from './errorHandler/errorHandler.ts';
export * from './scalars/index.ts';
export * from './pagination/index.ts';
export * from './plugins/defaultPlugin.ts';
export * from './sentry/expressSentryMiddleware.ts';
export * from './utils.ts';
export * from './context/index.ts';

// export a generic object with all Pocket Custom Scalars
import { GraphQLValidUrl, isoStringScalar } from './scalars/index.ts';

export const PocketDefaultScalars = {
  ISOString: isoStringScalar,
  ValidUrl: GraphQLValidUrl,
};
