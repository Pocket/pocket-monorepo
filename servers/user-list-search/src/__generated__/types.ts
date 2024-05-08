// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable */
/* tslint:disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { IContext } from '../server/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  FunctionalBoostValue: { input: any; output: any; }
  ISOString: { input: any; output: any; }
  Url: { input: any; output: any; }
  _FieldSet: { input: any; output: any; }
};

export type AdvancedSearchFilters = {
  contentType?: InputMaybe<SearchItemsContentType>;
  domain?: InputMaybe<Scalars['String']['input']>;
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<SearchItemsStatusFilter>;
  /**
   * Include only items with the following tags (exact)
   * in search results (OR combination)
   */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input field to boost the score of an elasticsearch document based on a specific field and value */
export type FunctionalBoostField = {
  /** A float number to boost the score by */
  factor: Scalars['Float']['input'];
  /** Field to evaluate for boosting */
  field: Scalars['String']['input'];
  /** The mathematical operation to use for boosting */
  operation: SearchFunctionalBoostOperation;
  /** Field value to evaluate */
  value: Scalars['FunctionalBoostValue']['input'];
};

export type Item = {
  __typename?: 'Item';
  /** Keyword highlights from search */
  highlights?: Maybe<ItemHighlights>;
  /** key field to identify the Item entity in the Parser service */
  itemId: Scalars['String']['output'];
};

/** Elasticsearch highlights */
export type ItemHighlights = {
  __typename?: 'ItemHighlights';
  full_text?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Save search to potentially appear in recentSearches response.
   * Requires premium account (otherwise will send ForbiddenError).
   */
  saveSearch?: Maybe<RecentSearch>;
};


export type MutationSaveSearchArgs = {
  search: RecentSearchInput;
};

/** Input for offset-pagination (internal backend use only). */
export type OffsetPaginationInput = {
  /**  Defaults to 30  */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /**  Defaults to 0  */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/**
 * Pagination request. To determine which edges to return, the connection
 * evaluates the `before` and `after` cursors (if given) to filter the
 * edges, then evaluates `first`/`last` to slice the edges (only include a
 * value for either `first` or `last`, not both). If all fields are null,
 * by default will return a page with the first 30 elements.
 */
export type PaginationInput = {
  /**
   * Returns the elements in the list that come after the specified cursor.
   * The specified cursor is not included in the result.
   */
  after?: InputMaybe<Scalars['String']['input']>;
  /**
   * Returns the elements in the list that come before the specified cursor.
   * The specified cursor is not included in the result.
   */
  before?: InputMaybe<Scalars['String']['input']>;
  /**
   * Returns the first _n_ elements from the list. Must be a non-negative integer.
   * If `first` contains a value, `last` should be null/omitted in the input.
   */
  first?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Returns the last _n_ elements from the list. Must be a non-negative integer.
   * If `last` contains a value, `first` should be null/omitted in the input.
   * Note: For premium search, setting `last` alone is not currently supported and
   * this has to set with before/last combination.
   */
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type RecentSearch = {
  __typename?: 'RecentSearch';
  context?: Maybe<RecentSearchContext>;
  sortId: Scalars['Int']['output'];
  term: Scalars['String']['output'];
};

export type RecentSearchContext = {
  __typename?: 'RecentSearchContext';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type RecentSearchInput = {
  /** The term that was used for search */
  term: Scalars['String']['input'];
  /**
   * Optional, the time the search was performed.
   * Defaults to current server time at time of request.
   */
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};

/**
 * Elasticsearch highlights.
 * Highlighted snippets from the following fields in the search results
 * so clients can show users where the query matches are.
 * Each field, if available, contains an array of html text snippets
 * that contain a match to the search term.
 * The matching text is wrapped in `<em>` tags, e.g. ["Hiss at <em>vacuum</em> cleaner if it fits i sits"]
 */
export type SaveItemSearchHighlights = {
  __typename?: 'SaveItemSearchHighlights';
  fullText?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type SavedItem = {
  __typename?: 'SavedItem';
  /** key field to identify the SavedItem entity in the ListAPI service */
  id: Scalars['ID']['output'];
};

export type SavedItemSearchResult = {
  __typename?: 'SavedItemSearchResult';
  savedItem: SavedItem;
  /**
   * Highlighted snippets from fields in the search results
   * searchHighlights is a premium user feature. Not available for free search.
   */
  searchHighlights?: Maybe<SaveItemSearchHighlights>;
};

/** The connection type for SavedItem. */
export type SavedItemSearchResultConnection = {
  __typename?: 'SavedItemSearchResultConnection';
  /** A list of edges. */
  edges: Array<SavedItemSearchResultEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SavedItemSearchResultEdge = {
  __typename?: 'SavedItemSearchResultEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: SavedItemSearchResult;
};

/** A page of SavedItemSearchResult, retrieved by offset-based pagination. */
export type SavedItemSearchResultPage = {
  __typename?: 'SavedItemSearchResultPage';
  entries: Array<SavedItemSearchResult>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

/** Input filed for filtering items */
export type SearchFilter = {
  /** Optional filter to items of a specific content type */
  contentType?: InputMaybe<Scalars['String']['input']>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']['input']>;
  /** Optional filter to get items that are favorited */
  favorite?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional filter to get items in a specific state */
  status?: InputMaybe<SearchStatus>;
  /** Optional fitler to get item with specific tags */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SearchFilterInput = {
  /** Optional, filter to get SavedItems based on content type */
  contentType?: InputMaybe<SearchItemsContentType>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']['input']>;
  /** Optional, filter to get user items that have been favorited */
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Optional, filter to get user items only based on title and url, ie Free Search
   * Note, though that if this is selected and the user is premium, they will not get search highligthing.
   */
  onlyTitleAndURL?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, filter to get user items based on status. */
  status?: InputMaybe<SearchItemsStatusFilter>;
};

/**
 * Used to detemermine whether to add or multiply a document's score by the
 * functional boost factor
 */
export enum SearchFunctionalBoostOperation {
  Add = 'ADD',
  Multiply = 'MULTIPLY'
}

/** Input field to get elasticsearch highlights of keywords */
export type SearchHighlightField = {
  /** Field to highlight */
  field: Scalars['String']['input'];
  /** The number of characters to return in addition to the keyword */
  size: Scalars['Int']['input'];
};

/** A SavedItem can be one of these content types */
export enum SearchItemsContentType {
  Article = 'ARTICLE',
  Video = 'VIDEO'
}

/** Enum to specify the sort by field (these are the current options, we could add more in the future) */
export enum SearchItemsSortBy {
  /** Indicates when a SavedItem was created */
  CreatedAt = 'CREATED_AT',
  /**
   * Sort SavedItems based on a relevance score
   * This is a feature of elasticsearch and current only available for premium search
   */
  Relevance = 'RELEVANCE',
  /** Estimated time to read a SavedItem */
  TimeToRead = 'TIME_TO_READ'
}

/** Enum to specify the sort order of user items fetched */
export enum SearchItemsSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Valid statuses a client may use to filter */
export enum SearchItemsStatusFilter {
  Archived = 'ARCHIVED',
  Unread = 'UNREAD'
}

/** Input field for search */
export type SearchParams = {
  /** Fields to search for the keyword in */
  fields: Array<InputMaybe<Scalars['String']['input']>>;
  /** Filters to be applied to the search */
  filters?: InputMaybe<SearchFilter>;
  /** Offset for pagination */
  from?: InputMaybe<Scalars['Int']['input']>;
  /** Operation to boost the score of a document based */
  functionalBoosts?: InputMaybe<Array<InputMaybe<FunctionalBoostField>>>;
  /** Fields that should be highlighted if keywords are found within them */
  highlightFields?: InputMaybe<Array<InputMaybe<SearchHighlightField>>>;
  /** Number of items to return */
  size?: InputMaybe<Scalars['Int']['input']>;
  /** Sorting for the search */
  sort?: InputMaybe<SearchSort>;
  /** The keyword to search for */
  term: Scalars['String']['input'];
};

/** The return type for the search query */
export type SearchResult = {
  __typename?: 'SearchResult';
  /** @deprecated Not required by implementing clients */
  page?: Maybe<Scalars['Int']['output']>;
  /** @deprecated Not required by implementing client */
  perPage?: Maybe<Scalars['Int']['output']>;
  /** Items found */
  results?: Maybe<Array<Maybe<Item>>>;
  /** Number of items found */
  totalResults: Scalars['Int']['output'];
};

/** Input field for sorting items */
export type SearchSort = {
  /** Direction of the sort (ASC/DESC) */
  direction: SearchSortDirection;
  /** Field in elasticsearch to sort by */
  field: Scalars['String']['input'];
};

/** Sort direction of the returned items. */
export enum SearchSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type SearchSortInput = {
  /** The field by which to sort user items */
  sortBy: SearchItemsSortBy;
  /** The order in which to sort user items */
  sortOrder?: InputMaybe<SearchItemsSortOrder>;
};

/**
 * An index item can be in one of these states
 * QUEUED implies an item that has not been archived
 */
export enum SearchStatus {
  Archived = 'ARCHIVED',
  Queued = 'QUEUED'
}

export type User = {
  __typename?: 'User';
  advancedSearch?: Maybe<SavedItemSearchResultConnection>;
  advancedSearchByOffset?: Maybe<SavedItemSearchResultPage>;
  /** key field to identify the User entity in the UserAPI service */
  id: Scalars['ID']['output'];
  recentSearches?: Maybe<Array<RecentSearch>>;
  /**
   * Premium search query. Name will be updated after client input
   * @deprecated Use searchSavedItems
   */
  search: SearchResult;
  /** Get a paginated list of user items that match a given term */
  searchSavedItems?: Maybe<SavedItemSearchResultConnection>;
  searchSavedItemsByOffset?: Maybe<SavedItemSearchResultPage>;
};


export type UserAdvancedSearchArgs = {
  filter?: InputMaybe<AdvancedSearchFilters>;
  pagination?: InputMaybe<PaginationInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<SearchSortInput>;
};


export type UserAdvancedSearchByOffsetArgs = {
  filter?: InputMaybe<AdvancedSearchFilters>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<SearchSortInput>;
};


export type UserSearchArgs = {
  params: SearchParams;
};


export type UserSearchSavedItemsArgs = {
  filter?: InputMaybe<SearchFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SearchSortInput>;
  term: Scalars['String']['input'];
};


export type UserSearchSavedItemsByOffsetArgs = {
  filter?: InputMaybe<SearchFilterInput>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  sort?: InputMaybe<SearchSortInput>;
  term: Scalars['String']['input'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ReferenceResolver<TResult, TReference, TContext> = (
      reference: TReference,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Promise<TResult> | TResult;

      type ScalarCheck<T, S> = S extends true ? T : NullableCheck<T, S>;
      type NullableCheck<T, S> = Maybe<T> extends T ? Maybe<ListCheck<NonNullable<T>, S>> : ListCheck<T, S>;
      type ListCheck<T, S> = T extends (infer U)[] ? NullableCheck<U, S>[] : GraphQLRecursivePick<T, S>;
      export type GraphQLRecursivePick<T, S> = { [K in keyof T & keyof S]: ScalarCheck<T[K], S[K]> };
    

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AdvancedSearchFilters: AdvancedSearchFilters;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  FunctionalBoostField: FunctionalBoostField;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FunctionalBoostValue: ResolverTypeWrapper<Scalars['FunctionalBoostValue']['output']>;
  ISOString: ResolverTypeWrapper<Scalars['ISOString']['output']>;
  Item: ResolverTypeWrapper<Item>;
  ItemHighlights: ResolverTypeWrapper<ItemHighlights>;
  Mutation: ResolverTypeWrapper<{}>;
  OffsetPaginationInput: OffsetPaginationInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  RecentSearch: ResolverTypeWrapper<RecentSearch>;
  RecentSearchContext: ResolverTypeWrapper<RecentSearchContext>;
  RecentSearchInput: RecentSearchInput;
  SaveItemSearchHighlights: ResolverTypeWrapper<SaveItemSearchHighlights>;
  SavedItem: ResolverTypeWrapper<SavedItem>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  SavedItemSearchResult: ResolverTypeWrapper<SavedItemSearchResult>;
  SavedItemSearchResultConnection: ResolverTypeWrapper<SavedItemSearchResultConnection>;
  SavedItemSearchResultEdge: ResolverTypeWrapper<SavedItemSearchResultEdge>;
  SavedItemSearchResultPage: ResolverTypeWrapper<SavedItemSearchResultPage>;
  SearchFilter: SearchFilter;
  SearchFilterInput: SearchFilterInput;
  SearchFunctionalBoostOperation: SearchFunctionalBoostOperation;
  SearchHighlightField: SearchHighlightField;
  SearchItemsContentType: SearchItemsContentType;
  SearchItemsSortBy: SearchItemsSortBy;
  SearchItemsSortOrder: SearchItemsSortOrder;
  SearchItemsStatusFilter: SearchItemsStatusFilter;
  SearchParams: SearchParams;
  SearchResult: ResolverTypeWrapper<SearchResult>;
  SearchSort: SearchSort;
  SearchSortDirection: SearchSortDirection;
  SearchSortInput: SearchSortInput;
  SearchStatus: SearchStatus;
  Url: ResolverTypeWrapper<Scalars['Url']['output']>;
  User: ResolverTypeWrapper<User>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AdvancedSearchFilters: AdvancedSearchFilters;
  String: Scalars['String']['output'];
  Boolean: Scalars['Boolean']['output'];
  FunctionalBoostField: FunctionalBoostField;
  Float: Scalars['Float']['output'];
  FunctionalBoostValue: Scalars['FunctionalBoostValue']['output'];
  ISOString: Scalars['ISOString']['output'];
  Item: Item;
  ItemHighlights: ItemHighlights;
  Mutation: {};
  OffsetPaginationInput: OffsetPaginationInput;
  Int: Scalars['Int']['output'];
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  RecentSearch: RecentSearch;
  RecentSearchContext: RecentSearchContext;
  RecentSearchInput: RecentSearchInput;
  SaveItemSearchHighlights: SaveItemSearchHighlights;
  SavedItem: SavedItem;
  ID: Scalars['ID']['output'];
  SavedItemSearchResult: SavedItemSearchResult;
  SavedItemSearchResultConnection: SavedItemSearchResultConnection;
  SavedItemSearchResultEdge: SavedItemSearchResultEdge;
  SavedItemSearchResultPage: SavedItemSearchResultPage;
  SearchFilter: SearchFilter;
  SearchFilterInput: SearchFilterInput;
  SearchHighlightField: SearchHighlightField;
  SearchParams: SearchParams;
  SearchResult: SearchResult;
  SearchSort: SearchSort;
  SearchSortInput: SearchSortInput;
  Url: Scalars['Url']['output'];
  User: User;
}>;

export interface FunctionalBoostValueScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['FunctionalBoostValue'], any> {
  name: 'FunctionalBoostValue';
}

export interface IsoStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOString'], any> {
  name: 'ISOString';
}

export type ItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Item'] = ResolversParentTypes['Item']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Item']>, { __typename: 'Item' } & GraphQLRecursivePick<ParentType, {"itemId":true}>, ContextType>;
  highlights?: Resolver<Maybe<ResolversTypes['ItemHighlights']>, ParentType, ContextType>;
  itemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ItemHighlightsResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ItemHighlights'] = ResolversParentTypes['ItemHighlights']> = ResolversObject<{
  full_text?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  url?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  saveSearch?: Resolver<Maybe<ResolversTypes['RecentSearch']>, ParentType, ContextType, RequireFields<MutationSaveSearchArgs, 'search'>>;
}>;

export type PageInfoResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RecentSearchResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['RecentSearch'] = ResolversParentTypes['RecentSearch']> = ResolversObject<{
  context?: Resolver<Maybe<ResolversTypes['RecentSearchContext']>, ParentType, ContextType>;
  sortId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  term?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RecentSearchContextResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['RecentSearchContext'] = ResolversParentTypes['RecentSearchContext']> = ResolversObject<{
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SaveItemSearchHighlightsResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SaveItemSearchHighlights'] = ResolversParentTypes['SaveItemSearchHighlights']> = ResolversObject<{
  fullText?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  url?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SavedItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItem'] = ResolversParentTypes['SavedItem']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['SavedItem']>, { __typename: 'SavedItem' } & GraphQLRecursivePick<ParentType, {"id":true}>, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SavedItemSearchResultResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItemSearchResult'] = ResolversParentTypes['SavedItemSearchResult']> = ResolversObject<{
  savedItem?: Resolver<ResolversTypes['SavedItem'], ParentType, ContextType>;
  searchHighlights?: Resolver<Maybe<ResolversTypes['SaveItemSearchHighlights']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SavedItemSearchResultConnectionResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItemSearchResultConnection'] = ResolversParentTypes['SavedItemSearchResultConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['SavedItemSearchResultEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SavedItemSearchResultEdgeResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItemSearchResultEdge'] = ResolversParentTypes['SavedItemSearchResultEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['SavedItemSearchResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SavedItemSearchResultPageResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItemSearchResultPage'] = ResolversParentTypes['SavedItemSearchResultPage']> = ResolversObject<{
  entries?: Resolver<Array<ResolversTypes['SavedItemSearchResult']>, ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SearchResultResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SearchResult'] = ResolversParentTypes['SearchResult']> = ResolversObject<{
  page?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  perPage?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  results?: Resolver<Maybe<Array<Maybe<ResolversTypes['Item']>>>, ParentType, ContextType>;
  totalResults?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Url'], any> {
  name: 'Url';
}

export type UserResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['User']>, { __typename: 'User' } & GraphQLRecursivePick<ParentType, {"id":true}>, ContextType>;
  advancedSearch?: Resolver<Maybe<ResolversTypes['SavedItemSearchResultConnection']>, ParentType, ContextType, Partial<UserAdvancedSearchArgs>>;
  advancedSearchByOffset?: Resolver<Maybe<ResolversTypes['SavedItemSearchResultPage']>, ParentType, ContextType, Partial<UserAdvancedSearchByOffsetArgs>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  recentSearches?: Resolver<Maybe<Array<ResolversTypes['RecentSearch']>>, ParentType, ContextType>;
  search?: Resolver<ResolversTypes['SearchResult'], ParentType, ContextType, RequireFields<UserSearchArgs, 'params'>>;
  searchSavedItems?: Resolver<Maybe<ResolversTypes['SavedItemSearchResultConnection']>, ParentType, ContextType, RequireFields<UserSearchSavedItemsArgs, 'term'>>;
  searchSavedItemsByOffset?: Resolver<Maybe<ResolversTypes['SavedItemSearchResultPage']>, ParentType, ContextType, RequireFields<UserSearchSavedItemsByOffsetArgs, 'term'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = IContext> = ResolversObject<{
  FunctionalBoostValue?: GraphQLScalarType;
  ISOString?: GraphQLScalarType;
  Item?: ItemResolvers<ContextType>;
  ItemHighlights?: ItemHighlightsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  RecentSearch?: RecentSearchResolvers<ContextType>;
  RecentSearchContext?: RecentSearchContextResolvers<ContextType>;
  SaveItemSearchHighlights?: SaveItemSearchHighlightsResolvers<ContextType>;
  SavedItem?: SavedItemResolvers<ContextType>;
  SavedItemSearchResult?: SavedItemSearchResultResolvers<ContextType>;
  SavedItemSearchResultConnection?: SavedItemSearchResultConnectionResolvers<ContextType>;
  SavedItemSearchResultEdge?: SavedItemSearchResultEdgeResolvers<ContextType>;
  SavedItemSearchResultPage?: SavedItemSearchResultPageResolvers<ContextType>;
  SearchResult?: SearchResultResolvers<ContextType>;
  Url?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
}>;

