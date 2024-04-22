import { ApolloServerPlugin, BaseContext } from '@apollo/server';

import type { DataSource } from 'apollo-datasource';

type DataSources = Record<string, DataSource>;
type DataSourcesFn = () => DataSources;

export interface ContextWithDataSources extends BaseContext {
  dataSources?: DataSources;
}

/**
 * Data sources have been deprecated, but this is already quite a large
 * migration. Adding this plugin as a stop-gap to allow this to be migrated
 * separately.
 *
 * TODO: ParserAPI should be migrated to match the RESTDataSource interface that
 * is documented here:
 * https://www.apollographql.com/docs/apollo-server/data/fetching-rest/
 * (or just moved away from the DataSource interface entirely).
 *
 * This stop-gap is provided by the v4 migration guide:
 * https://www.apollographql.com/docs/apollo-server/migration/#datasources
 */
export const LegacyDataSourcesPlugin = (options: {
  dataSources: DataSourcesFn;
}): ApolloServerPlugin<ContextWithDataSources> => ({
  requestDidStart: async (requestContext) => {
    const dataSources = options.dataSources();
    const initializers = Object.values(dataSources).map(async (dataSource) => {
      if (dataSource.initialize)
        dataSource.initialize({
          cache: requestContext.cache,
          context: requestContext.contextValue,
        });
    });

    await Promise.all(initializers);

    requestContext.contextValue.dataSources = dataSources;
  },
});
