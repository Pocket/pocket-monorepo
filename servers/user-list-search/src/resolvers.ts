import { GraphQLScalarType, Kind } from 'graphql';
import {
  ElasticSearchFilter,
  ElasticSearchParams,
  search,
  SearchParams,
  PocketSearchResponse,
  searchSavedItems,
  advancedSearch,
} from './datasource/elasticsearch/elasticsearchSearch';
import {
  AuthenticationError,
  UserInputError,
} from '@pocket-tools/apollo-utils';
import { IContext } from './server/context';
import { SavedItemDataService } from './datasource/SavedItemsDataSource';
import {
  SavedItemSearchResultConnection,
  AdvancedSearchParams,
  SearchSavedItemParameters,
} from './types';

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
): Promise<PocketSearchResponse> {
  if (context.userId == null) {
    throw new AuthenticationError('Must be logged in to perform search');
  }
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

export const resolvers = {
  FunctionalBoostValue: functionalBoostValue,
  User: {
    search: elasticSearch,
    advancedSearch: async (
      _,
      params: AdvancedSearchParams,
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
      const input: SearchSavedItemParameters = {
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
  },
};
