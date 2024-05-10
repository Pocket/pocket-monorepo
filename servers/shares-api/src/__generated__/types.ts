// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable */
/* tslint:disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { IContext } from '../apollo/context';
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
  ISOString: { input: any; output: any; }
  Max300CharString: { input: any; output: any; }
  ValidUrl: { input: any; output: any; }
  _FieldSet: { input: any; output: any; }
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Attach share context to a Pocket Share. If a context already exists
   * on the Pocket Share, it will be overrwritten. Session ID via the `guid`
   * field on the JWT is used to determine ownership of a share.
   * That means users may only edit share links created in the same
   * session (intended to be a post-share add, not something returned to
   * later). It also lets us attribute ownership to anonymous/logged-out
   * users.
   * Null values in provided context will not overrwrite existing values
   * if there are any, but but empty values will (e.g. empty string, empty array).
   * Attempting to update a nonexistent share or a share that is not owned
   * by the session user will return ShareNotFound.
   */
  addShareContext?: Maybe<ShareResult>;
  /**
   * Create a Pocket Share for a provided target URL, optionally
   * with additional share context.
   */
  createShareLink?: Maybe<PocketShare>;
};


export type MutationAddShareContextArgs = {
  context: ShareContextInput;
  slug: Scalars['ID']['input'];
};


export type MutationCreateShareLinkArgs = {
  context?: InputMaybe<ShareContextInput>;
  target: Scalars['ValidUrl']['input'];
};

export type PocketShare = {
  __typename?: 'PocketShare';
  context?: Maybe<ShareContext>;
  createdAt: Scalars['ISOString']['output'];
  shareUrl: Scalars['ValidUrl']['output'];
  slug: Scalars['ID']['output'];
  targetUrl: Scalars['ValidUrl']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Resolve data for a Shared link, or return a Not Found
   * message if the share does not exist.
   */
  shareSlug?: Maybe<ShareResult>;
};


export type QueryShareSlugArgs = {
  slug: Scalars['ID']['input'];
};

export type ShareContext = {
  __typename?: 'ShareContext';
  /** User-provided highlights of the content */
  highlights?: Maybe<Array<ShareHighlight>>;
  /** A user-provided comment/note on the shared content. */
  note?: Maybe<Scalars['String']['output']>;
};

/** Input for mutation which creates a new Pocket Share link. */
export type ShareContextInput = {
  /** Quoted content from the Share source */
  highlights?: InputMaybe<ShareHighlightInput>;
  /** A note/comment about the Share (up to 500 characters). */
  note?: InputMaybe<Scalars['String']['input']>;
};

export type ShareHighlight = {
  __typename?: 'ShareHighlight';
  /** Highlighted text on a piece of shared content. */
  quote: Scalars['String']['output'];
};

export type ShareHighlightInput = {
  /**
   * Highlighted text on a piece of shared content.
   * This is a permissive constraint but there needs
   * to be _a_ constraint.
   * This input is not required, but if present 'quotes'
   * is required as it is the only field.
   * Limited to 300 characters per quote (longer quotes
   * will not be rejected, but will be truncated).
   */
  quotes: Array<Scalars['Max300CharString']['input']>;
};

export type ShareNotFound = {
  __typename?: 'ShareNotFound';
  message?: Maybe<Scalars['String']['output']>;
};

export type ShareResult = PocketShare | ShareNotFound;

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

/** Mapping of union types */
export type ResolversUnionTypes<RefType extends Record<string, unknown>> = ResolversObject<{
  ShareResult: ( PocketShare ) | ( ShareNotFound );
}>;


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ISOString: ResolverTypeWrapper<Scalars['ISOString']['output']>;
  Max300CharString: ResolverTypeWrapper<Scalars['Max300CharString']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  PocketShare: ResolverTypeWrapper<PocketShare>;
  Query: ResolverTypeWrapper<{}>;
  ShareContext: ResolverTypeWrapper<ShareContext>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  ShareContextInput: ShareContextInput;
  ShareHighlight: ResolverTypeWrapper<ShareHighlight>;
  ShareHighlightInput: ShareHighlightInput;
  ShareNotFound: ResolverTypeWrapper<ShareNotFound>;
  ShareResult: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ShareResult']>;
  ValidUrl: ResolverTypeWrapper<Scalars['ValidUrl']['output']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ISOString: Scalars['ISOString']['output'];
  Max300CharString: Scalars['Max300CharString']['output'];
  Mutation: {};
  ID: Scalars['ID']['output'];
  PocketShare: PocketShare;
  Query: {};
  ShareContext: ShareContext;
  String: Scalars['String']['output'];
  ShareContextInput: ShareContextInput;
  ShareHighlight: ShareHighlight;
  ShareHighlightInput: ShareHighlightInput;
  ShareNotFound: ShareNotFound;
  ShareResult: ResolversUnionTypes<ResolversParentTypes>['ShareResult'];
  ValidUrl: Scalars['ValidUrl']['output'];
  Boolean: Scalars['Boolean']['output'];
}>;

export interface IsoStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOString'], any> {
  name: 'ISOString';
}

export interface Max300CharStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Max300CharString'], any> {
  name: 'Max300CharString';
}

export type MutationResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addShareContext?: Resolver<Maybe<ResolversTypes['ShareResult']>, ParentType, ContextType, RequireFields<MutationAddShareContextArgs, 'context' | 'slug'>>;
  createShareLink?: Resolver<Maybe<ResolversTypes['PocketShare']>, ParentType, ContextType, RequireFields<MutationCreateShareLinkArgs, 'target'>>;
}>;

export type PocketShareResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['PocketShare'] = ResolversParentTypes['PocketShare']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['PocketShare']>, { __typename: 'PocketShare' } & GraphQLRecursivePick<ParentType, {"slug":true,"targetUrl":true}>, ContextType>;
  context?: Resolver<Maybe<ResolversTypes['ShareContext']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['ISOString'], ParentType, ContextType>;
  shareUrl?: Resolver<ResolversTypes['ValidUrl'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  targetUrl?: Resolver<ResolversTypes['ValidUrl'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  shareSlug?: Resolver<Maybe<ResolversTypes['ShareResult']>, ParentType, ContextType, RequireFields<QueryShareSlugArgs, 'slug'>>;
}>;

export type ShareContextResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ShareContext'] = ResolversParentTypes['ShareContext']> = ResolversObject<{
  highlights?: Resolver<Maybe<Array<ResolversTypes['ShareHighlight']>>, ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShareHighlightResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ShareHighlight'] = ResolversParentTypes['ShareHighlight']> = ResolversObject<{
  quote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShareNotFoundResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ShareNotFound'] = ResolversParentTypes['ShareNotFound']> = ResolversObject<{
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShareResultResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ShareResult'] = ResolversParentTypes['ShareResult']> = ResolversObject<{
  __resolveType: TypeResolveFn<'PocketShare' | 'ShareNotFound', ParentType, ContextType>;
}>;

export interface ValidUrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ValidUrl'], any> {
  name: 'ValidUrl';
}

export type Resolvers<ContextType = IContext> = ResolversObject<{
  ISOString?: GraphQLScalarType;
  Max300CharString?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  PocketShare?: PocketShareResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ShareContext?: ShareContextResolvers<ContextType>;
  ShareHighlight?: ShareHighlightResolvers<ContextType>;
  ShareNotFound?: ShareNotFoundResolvers<ContextType>;
  ShareResult?: ShareResultResolvers<ContextType>;
  ValidUrl?: GraphQLScalarType;
}>;

