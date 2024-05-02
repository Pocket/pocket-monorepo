// this is the entry point for the npm package
// anything we want consumable (module, type, class, etc) should be exported here
export * from './cache/DataloaderKeyValueCache.js';
export * from './cache/interface.js';
export * from './dataloader.js';
export * from './errorHandler/errorHandler.js';
export * from './scalars/index.js';
export * from './pagination/index.js';
export * from './plugins/defaultPlugin.js';
export * from './sentry/apolloSentryPlugin.js';

export * from './sentry/expressSentryMiddleware.js';
export * from './utils.js';

// export a generic object with all Pocket Custom Scalars
import { GraphQLValidUrl, isoStringScalar } from './scalars/index.js';

export type { BaseContext } from '@apollo/server';

export const PocketDefaultScalars = {
  ISOString: isoStringScalar,
  ValidUrl: GraphQLValidUrl,
};
