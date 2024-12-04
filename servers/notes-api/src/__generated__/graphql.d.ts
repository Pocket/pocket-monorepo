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
  ISOString: { input: Date | string; output: Date | string; }
  Markdown: { input: string; output: string; }
  ProseMirrorJson: { input: string; output: string; }
  ValidUrl: { input: URL | string; output: URL | string; }
  _FieldSet: { input: any; output: any; }
};

/**
 * Input to create a new Note seeded with copied content from a page.
 * The entire content becomes editable and is not able to be "reattached"
 * like a traditional highlight.
 */
export type CreateNoteFromQuoteInput = {
  /**
   * When this note was created. If not provided, defaults to server time upon
   * receiving request.
   */
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  /**
   * Client-provided UUID for the new Note.
   * If not provided, will be generated on the server.
   */
  id?: InputMaybe<Scalars['ID']['input']>;
  /**
   * JSON representation of a ProseMirror document, which
   * contains the formatted snipped text. This is used to seed
   * the initial Note document state, and will become editable.
   */
  quote: Scalars['ProseMirrorJson']['input'];
  /**
   * The Web Resource where the quote is taken from.
   * This should always be sent by the client where possible,
   * but in some cases (e.g. copying from mobile apps) there may
   * not be an accessible source url.
   */
  source?: InputMaybe<Scalars['ValidUrl']['input']>;
  /** Optional title for this Note */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input to create a new Note */
export type CreateNoteInput = {
  /**
   * When this note was created. If not provided, defaults to server time upon
   * receiving request.
   */
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  /** JSON representation of a ProseMirror document */
  docContent: Scalars['ProseMirrorJson']['input'];
  /**
   * Client-provided UUID for the new Note.
   * If not provided, will be generated on the server.
   */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Optional URL to link this Note to. */
  source?: InputMaybe<Scalars['ValidUrl']['input']>;
  /** Optional title for this Note */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type EditNoteTitleInput = {
  /** The ID of the note to edit */
  id: Scalars['ID']['input'];
  /** The new title for the note (can be an empty string) */
  title: Scalars['String']['input'];
  /**
   * When the update was made. If not provided, defaults to the server
   * time upon receiving request.
   */
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new note, optionally with title and content */
  createNote: Note;
  /**
   * Create a new note, with a pre-populated block that contains the quoted and cited text
   * selected by a user.
   */
  createNoteFromQuote: Note;
  /** Edit the title of a Note. */
  editNoteTitle?: Maybe<Note>;
};


export type MutationCreateNoteArgs = {
  input: CreateNoteInput;
};


export type MutationCreateNoteFromQuoteArgs = {
  input: CreateNoteFromQuoteInput;
};


export type MutationEditNoteTitleArgs = {
  input: EditNoteTitleInput;
};

/**
 * A Note is an entity which may contain extracted components
 * from websites (clippings/snippets), user-generated rich text content,
 * and may be linked to a source url.
 */
export type Note = {
  __typename?: 'Note';
  /** Whether this Note has been marked as archived (hide from default view). */
  archived: Scalars['Boolean']['output'];
  /** Markdown preview of the note content for summary view. */
  contentPreview?: Maybe<Scalars['Markdown']['output']>;
  /** When this note was created */
  createdAt: Scalars['ISOString']['output'];
  /**
   * Whether this Note has been marked for deletion (will be eventually
   * removed from the server). Clients should delete Notes from their local
   * storage if this value is true.
   */
  deleted: Scalars['Boolean']['output'];
  /** JSON representation of a ProseMirror document */
  docContent?: Maybe<Scalars['ProseMirrorJson']['output']>;
  /** This Note's identifier */
  id: Scalars['ID']['output'];
  /**
   * The SavedItem entity this note is attached to (either directly
   * or via a Clipping, if applicable)
   */
  savedItem?: Maybe<SavedItem>;
  /**
   * The URL this entity was created from (either directly or via
   * a Clipping, if applicable).
   */
  source?: Maybe<Scalars['ValidUrl']['output']>;
  /** Title of this note */
  title?: Maybe<Scalars['String']['output']>;
  /** When this note was last updated */
  updatedAt: Scalars['ISOString']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Retrieve a specific Note */
  note?: Maybe<Note>;
};


export type QueryNoteArgs = {
  id: Scalars['ID']['input'];
};

export type SavedItem = {
  __typename?: 'SavedItem';
  /** The URL of the SavedItem */
  url: Scalars['String']['output'];
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
  CreateNoteFromQuoteInput: CreateNoteFromQuoteInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  CreateNoteInput: CreateNoteInput;
  EditNoteTitleInput: EditNoteTitleInput;
  ISOString: ResolverTypeWrapper<Scalars['ISOString']['output']>;
  Markdown: ResolverTypeWrapper<Scalars['Markdown']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Note: ResolverTypeWrapper<Note>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ProseMirrorJson: ResolverTypeWrapper<Scalars['ProseMirrorJson']['output']>;
  Query: ResolverTypeWrapper<{}>;
  SavedItem: ResolverTypeWrapper<SavedItem>;
  ValidUrl: ResolverTypeWrapper<Scalars['ValidUrl']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  CreateNoteFromQuoteInput: CreateNoteFromQuoteInput;
  ID: Scalars['ID']['output'];
  String: Scalars['String']['output'];
  CreateNoteInput: CreateNoteInput;
  EditNoteTitleInput: EditNoteTitleInput;
  ISOString: Scalars['ISOString']['output'];
  Markdown: Scalars['Markdown']['output'];
  Mutation: {};
  Note: Note;
  Boolean: Scalars['Boolean']['output'];
  ProseMirrorJson: Scalars['ProseMirrorJson']['output'];
  Query: {};
  SavedItem: SavedItem;
  ValidUrl: Scalars['ValidUrl']['output'];
}>;

export interface IsoStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOString'], any> {
  name: 'ISOString';
}

export interface MarkdownScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Markdown'], any> {
  name: 'Markdown';
}

export type MutationResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createNote?: Resolver<ResolversTypes['Note'], ParentType, ContextType, RequireFields<MutationCreateNoteArgs, 'input'>>;
  createNoteFromQuote?: Resolver<ResolversTypes['Note'], ParentType, ContextType, RequireFields<MutationCreateNoteFromQuoteArgs, 'input'>>;
  editNoteTitle?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationEditNoteTitleArgs, 'input'>>;
}>;

export type NoteResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Note'] = ResolversParentTypes['Note']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Note']>, { __typename: 'Note' } & GraphQLRecursivePick<ParentType, {"id":true}>, ContextType>;
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  contentPreview?: Resolver<Maybe<ResolversTypes['Markdown']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['ISOString'], ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  docContent?: Resolver<Maybe<ResolversTypes['ProseMirrorJson']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  savedItem?: Resolver<Maybe<ResolversTypes['SavedItem']>, ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['ValidUrl']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['ISOString'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ProseMirrorJsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ProseMirrorJson'], any> {
  name: 'ProseMirrorJson';
}

export type QueryResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  note?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<QueryNoteArgs, 'id'>>;
}>;

export type SavedItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItem'] = ResolversParentTypes['SavedItem']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['SavedItem']>, { __typename: 'SavedItem' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ValidUrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ValidUrl'], any> {
  name: 'ValidUrl';
}

export type Resolvers<ContextType = IContext> = ResolversObject<{
  ISOString?: GraphQLScalarType;
  Markdown?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Note?: NoteResolvers<ContextType>;
  ProseMirrorJson?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  SavedItem?: SavedItemResolvers<ContextType>;
  ValidUrl?: GraphQLScalarType;
}>;

