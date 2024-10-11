import { GraphQLScalarType, Kind } from 'graphql';
import {
  ElasticSearchFilter,
  ElasticSearchParams,
  search,
  searchSavedItems,
  searchSavedItemsByOffset,
  advancedSearch,
  advancedSearchByOffset,
} from './datasource/elasticsearch/elasticsearchSearch';
import {
  PocketDefaultScalars,
  UserInputError,
} from '@pocket-tools/apollo-utils';
import { IContext } from './server/context';
import { SavedItemDataService } from './datasource/SavedItemsDataSource';
import { config } from './config';
import { MysqlDataSource } from './datasource/MysqlDataSource';
import {
  Resolvers,
  SearchResult,
  SearchParams,
  UserAdvancedSearchArgs,
  UserAdvancedSearchByOffsetArgs,
  SavedItemSearchResultConnection,
  SavedItemSearchResultPage,
  UserSearchSavedItemsByOffsetArgs,
  RecentSearch,
  UserSearchSavedItemsArgs,
  CorpusSearchConnection,
} from './__generated__/types';
import { CorpusSearchModel } from './corpus';
import { EventBus } from './events/EventBus';
import * as Sentry from '@sentry/node';

/**
 * Custom type for FunctionalBoostValue coming from client.
 * The value can be an a boolean or a string
 */
const functionalBoostValue = new GraphQLScalarType({
  name: 'FunctionalBoostValue',
  description: 'FunctionalBoostValue custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.BOOLEAN:
      case Kind.STRING:
        return ast.value;
      default:
        throw new Error(
          `FunctionalBoostValue cannot represent non boolean/non string value`,
        );
    }
  },
});

/**
 * Search
 * @param _
 * @param params
 * @param context
 */
function elasticSearch(
  _,
  { params }: { params: SearchParams },
  context: IContext,
): Promise<SearchResult> {
  const searchFilter: ElasticSearchFilter = {
    userId: context.userId,
    ...params['filters'],
  };
  const searchParams: ElasticSearchParams = {
    ...params,
    filters: searchFilter,
  };
  return search(searchParams);
}

export const resolvers: Resolvers = {
  ...PocketDefaultScalars,
  FunctionalBoostValue: functionalBoostValue,
  User: {
    search: elasticSearch,
    advancedSearch: async (
      _,
      params: UserAdvancedSearchArgs,
      context: IContext,
    ): Promise<SavedItemSearchResultConnection> => {
      if (params.pagination?.before || params.pagination?.last) {
        throw new UserInputError(
          'Pagination by "before"/"last" are not supported. ' +
            'Use "first"/"after" instead.',
        );
      }
      // Premium search
      if (context.userIsPremium) {
        if (!params.filter && !params.queryString) {
          throw new UserInputError(
            'Must provide either filters or query string to search',
          );
        }
        return advancedSearch(params, context.userId);
      }
      // Free search
      const searchDataService = new SavedItemDataService(context);
      const input: UserSearchSavedItemsArgs = {
        term: params.queryString,
        sort: params.sort,
        pagination: params.pagination,
      };
      if (params.filter) {
        // Only include valid filters for basic search
        const { domain, isFavorite, contentType, status } = params.filter;
        input['filter'] = { domain, isFavorite, contentType, status };
      }
      return searchDataService.searchSavedItems(input);
    },
    searchSavedItems: async (
      parent,
      params,
      context: IContext,
    ): Promise<SavedItemSearchResultConnection> => {
      // If the user is premium, and they did not select onlyTitleAndURL
      // send them down the premium search path
      // Note that this will note return search highlights
      if (context.userIsPremium && !params.filter?.onlyTitleAndURL) {
        return searchSavedItems(params, context.userId);
      }

      const searchDataService = new SavedItemDataService(context);
      return searchDataService.searchSavedItems(params);
    },
    searchSavedItemsByOffset: async (
      parent,
      params,
      context: IContext,
    ): Promise<SavedItemSearchResultPage> => {
      // Set up default to ensure pagination fields are always present
      params.pagination = {
        limit: config.pagination.defaultPageSize,
        offset: 0,
        ...(params.pagination ?? {}),
      };
      // If the user is premium, and they did not select onlyTitleAndURL
      // send them down the premium search path
      // Note that this will not return search highlights
      if (context.userIsPremium && !params.filter?.onlyTitleAndURL) {
        return searchSavedItemsByOffset(params, context.userId);
      }

      const searchDataService = new SavedItemDataService(context);
      return searchDataService.searchSavedItemsByOffset(params);
    },
    advancedSearchByOffset: async (
      _,
      params: UserAdvancedSearchByOffsetArgs,
      context: IContext,
    ): Promise<SavedItemSearchResultPage> => {
      // Set up default to ensure pagination fields are always present
      params.pagination = {
        limit: config.pagination.defaultPageSize,
        offset: 0,
        ...(params.pagination ?? {}),
      };
      // Premium search
      if (context.userIsPremium) {
        if (!params.filter && !params.queryString) {
          throw new UserInputError(
            'Must provide either filters or query string to search',
          );
        }
        return advancedSearchByOffset(params, context.userId);
      }
      // Free search
      const searchDataService = new SavedItemDataService(context);
      const input: UserSearchSavedItemsByOffsetArgs = {
        term: params.queryString,
        sort: params.sort,
        pagination: params.pagination,
      };
      if (params.filter) {
        // Only include valid filters for basic search
        const { domain, isFavorite, contentType, status } = params.filter;
        input['filter'] = { domain, isFavorite, contentType, status };
      }
      return searchDataService.searchSavedItemsByOffset(input);
    },
    recentSearches: async (
      parent,
      params,
      context: IContext,
    ): Promise<RecentSearch[]> => {
      return new MysqlDataSource().getRecentSearches(parseInt(context.userId));
    },
  },
  Query: {
    searchCorpus: async (
      _,
      args,
      context: IContext,
    ): Promise<CorpusSearchConnection> => {
      if (args.pagination?.before || args.pagination?.last) {
        throw new UserInputError(
          'Pagination by "before"/"last" are not supported. ' +
            'Use "first"/"after" instead.',
        );
      }
      const res = (await new CorpusSearchModel(context).search(args)) as any;
      // Async event emission
      new EventBus()
        .sendCorpusSearchResultEvent(res, context, args)
        // Shouldn't need to catch since errors should be handled, but just in case
        .catch((e) => Sentry.captureException(e));
      return res;
    },
  },
  Mutation: {
    saveSearch: async (
      _,
      { search }: { search: { term: string; timestamp: Date } },
      context: IContext,
    ): Promise<RecentSearch> => {
      await new MysqlDataSource().insertRecentSearch(
        parseInt(context.userId),
        search.term,
        search.timestamp,
      );
      return {
        term: search.term,
        sortId: 0,
        context: null,
      };
    },
  },
};
