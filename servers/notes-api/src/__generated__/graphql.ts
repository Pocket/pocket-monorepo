// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable */
/* tslint:disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { NoteConnectionModel, NoteResponse } from '../models/Note';
import { SavedItemModel } from '../models/SavedItem';
import { IContext } from '../apollo/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
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

export type ArchiveNoteInput = {
  /**
   * The ID of the note to archive or unarchive
   * (depends on mutation).
   */
  id: Scalars['ID']['input'];
  /**
   * When the note was archived or unarchived.
   * If not provided, defaults to the server time upon
   * receiving request.
   */
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
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

/**
 * Input to create a new Note with markdown-formatted
 * content string.
 */
export type CreateNoteMarkdownInput = {
  /**
   * When this note was created. If not provided, defaults to server time upon
   * receiving request.
   */
  createdAt?: InputMaybe<Scalars['ISOString']['input']>;
  /** The document content in Commonmark Markdown. */
  docMarkdown: Scalars['Markdown']['input'];
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

export type DeleteNoteInput = {
  /**
   * When the note was deleted was made. If not provided, defaults to
   * the server time upon receiving request.
   */
  deletedAt?: InputMaybe<Scalars['ISOString']['input']>;
  /** The ID of the note to delete */
  id: Scalars['ID']['input'];
};

/** Input for editing the content of a Note (user-generated) */
export type EditNoteContentInput = {
  /** JSON representation of a ProseMirror document */
  docContent: Scalars['ProseMirrorJson']['input'];
  /** The ID of the note to edit */
  noteId: Scalars['ID']['input'];
  /** The time this update was made (defaults to server time) */
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
};

/**
 * Input for editing the content of a Note (user-generated),
 * providing the content as a Markdown-formatted string.
 */
export type EditNoteContentMarkdownInput = {
  /** Commonmark Markdown string representing the document content. */
  docMarkdown: Scalars['Markdown']['input'];
  /** The ID of the note to edit */
  noteId: Scalars['ID']['input'];
  /** The time this update was made (defaults to server time) */
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
};

export type EditNoteTitleInput = {
  /** The ID of the note to edit */
  id: Scalars['ID']['input'];
  /**
   * The new title for the note. If null, sets the title
   * field to null (deletes it).
   */
  title?: InputMaybe<Scalars['String']['input']>;
  /**
   * When the update was made. If not provided, defaults to the server
   * time upon receiving request.
   */
  updatedAt?: InputMaybe<Scalars['ISOString']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Archive a note.
   * If the Note does not exist or is inaccessible for the current user,
   * response will be null and a NOT_FOUND error will be included in the
   * errors array.
   */
  archiveNote?: Maybe<Note>;
  /** Create a new note, optionally with title and content */
  createNote: Note;
  /** Create a new note, optionally with title and markdown content */
  createNoteMarkdown: Note;
  /**
   * Delete a note and all attachments. Returns True if the note was successfully
   * deleted. If the note cannot be deleted or does not exist, returns False.
   * Errors will be included in the errors array if applicable.
   */
  deleteNote: Scalars['ID']['output'];
  /**
   * Edit the content of a Note.
   * If the Note does not exist or is inaccessible for the current user,
   * response will be null and a NOT_FOUND error will be included in the
   * errors array.
   */
  editNoteContent?: Maybe<Note>;
  /**
   * Edit the content of a Note, providing a markdown document instead
   * of a Prosemirror JSON.
   * If the Note does not exist or is inaccessible for the current user,
   * response will be null and a NOT_FOUND error will be included in the
   * errors array.
   */
  editNoteContentMarkdown?: Maybe<Note>;
  /**
   * Edit the title of a Note.
   * If the Note does not exist or is inaccessible for the current user,
   * response will be null and a NOT_FOUND error will be included in the
   * errors array.
   */
  editNoteTitle?: Maybe<Note>;
  /**
   * Unarchive a note.
   * If the Note does not exist or is inaccessible for the current user,
   * response will be null and a NOT_FOUND error will be included in the
   * errors array.
   */
  unArchiveNote?: Maybe<Note>;
};


export type MutationArchiveNoteArgs = {
  input: ArchiveNoteInput;
};


export type MutationCreateNoteArgs = {
  input: CreateNoteInput;
};


export type MutationCreateNoteMarkdownArgs = {
  input: CreateNoteMarkdownInput;
};


export type MutationDeleteNoteArgs = {
  input: DeleteNoteInput;
};


export type MutationEditNoteContentArgs = {
  input: EditNoteContentInput;
};


export type MutationEditNoteContentMarkdownArgs = {
  input: EditNoteContentMarkdownInput;
};


export type MutationEditNoteTitleArgs = {
  input: EditNoteTitleInput;
};


export type MutationUnArchiveNoteArgs = {
  input: ArchiveNoteInput;
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
  /**
   * JSON representation of a ProseMirror document
   * (compatible with Markdown)
   */
  docContent?: Maybe<Scalars['ProseMirrorJson']['output']>;
  /** Markdown representation of the note content */
  docMarkdown?: Maybe<Scalars['Markdown']['output']>;
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

/** The connection type for Note. */
export type NoteConnection = {
  __typename?: 'NoteConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<NoteEdge>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of Notes in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type NoteEdge = {
  __typename?: 'NoteEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The Note at the end of the edge. */
  node?: Maybe<Note>;
};

/** Filter for retrieving Notes */
export type NoteFilterInput = {
  /**
   * Filter to retrieve Notes by archived status (true/false).
   * If not provided, notes will not be filtered by archived status.
   */
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Filter to choose whether to include notes marked for server-side
   * deletion in the response (defaults to false).
   */
  excludeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Filter to show notes which are attached to a source URL
   * directly or via clipping, or are standalone
   * notes. If not provided, notes will not be filtered by source url.
   */
  isAttachedToSave?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter to retrieve notes after a timestamp, e.g. for syncing. */
  since?: InputMaybe<Scalars['ISOString']['input']>;
};

/** Enum to specify the sort by field (these are the current options, we could add more in the future) */
export enum NoteSortBy {
  CreatedAt = 'CREATED_AT',
  UpdatedAt = 'UPDATED_AT'
}

/** Input to sort fetched Notes. If unspecified, defaults to UPDATED_AT, DESC. */
export type NoteSortInput = {
  /** The field by which to sort Notes */
  sortBy: NoteSortBy;
  /** The order in which to sort Notes */
  sortOrder: NoteSortOrder;
};

/** Possible values for sort ordering (ascending/descending) */
export enum NoteSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

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
 * value for either `first` or `last`, not both).
 * The max allowed limit for `first`/`last` is 100. The server would reset
 * this values to 100 if the request has `first`/`last` set greater than 100.
 * If all fields are null, by default will return a page with the first 30 elements.
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
   */
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type Query = {
  __typename?: 'Query';
  /** Retrieve a specific Note */
  note?: Maybe<Note>;
  /** Retrieve a user's Notes */
  notes?: Maybe<NoteConnection>;
};


export type QueryNoteArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNotesArgs = {
  filter?: InputMaybe<NoteFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<NoteSortInput>;
};

export type SavedItem = {
  __typename?: 'SavedItem';
  /**
   * The notes associated with this SavedItem, optionally
   * filtered to retrieve after a 'since' parameter.
   */
  notes: NoteConnection;
  /** The URL of the SavedItem */
  url: Scalars['String']['output'];
};


export type SavedItemNotesArgs = {
  filter?: InputMaybe<SavedItemNoteFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<NoteSortInput>;
};

/** Filter for retrieving Notes attached to a SavedItem */
export type SavedItemNoteFilterInput = {
  /**
   * Filter to retrieve Notes by archived status (true/false).
   * If not provided, notes will not be filtered by archived status.
   */
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Filter to choose whether to include notes marked for server-side
   * deletion in the response (defaults to false).
   */
  excludeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter to retrieve notes after a timestamp, e.g. for syncing. */
  since?: InputMaybe<Scalars['ISOString']['input']>;
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
  ArchiveNoteInput: ArchiveNoteInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  CreateNoteInput: CreateNoteInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  CreateNoteMarkdownInput: CreateNoteMarkdownInput;
  DeleteNoteInput: DeleteNoteInput;
  EditNoteContentInput: EditNoteContentInput;
  EditNoteContentMarkdownInput: EditNoteContentMarkdownInput;
  EditNoteTitleInput: EditNoteTitleInput;
  ISOString: ResolverTypeWrapper<Scalars['ISOString']['output']>;
  Markdown: ResolverTypeWrapper<Scalars['Markdown']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Note: ResolverTypeWrapper<NoteResponse>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  NoteConnection: ResolverTypeWrapper<NoteConnectionModel>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  NoteEdge: ResolverTypeWrapper<Omit<NoteEdge, 'node'> & { node?: Maybe<ResolversTypes['Note']> }>;
  NoteFilterInput: NoteFilterInput;
  NoteSortBy: NoteSortBy;
  NoteSortInput: NoteSortInput;
  NoteSortOrder: NoteSortOrder;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  ProseMirrorJson: ResolverTypeWrapper<Scalars['ProseMirrorJson']['output']>;
  Query: ResolverTypeWrapper<{}>;
  SavedItem: ResolverTypeWrapper<SavedItemModel>;
  SavedItemNoteFilterInput: SavedItemNoteFilterInput;
  ValidUrl: ResolverTypeWrapper<Scalars['ValidUrl']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ArchiveNoteInput: ArchiveNoteInput;
  ID: Scalars['ID']['output'];
  CreateNoteInput: CreateNoteInput;
  String: Scalars['String']['output'];
  CreateNoteMarkdownInput: CreateNoteMarkdownInput;
  DeleteNoteInput: DeleteNoteInput;
  EditNoteContentInput: EditNoteContentInput;
  EditNoteContentMarkdownInput: EditNoteContentMarkdownInput;
  EditNoteTitleInput: EditNoteTitleInput;
  ISOString: Scalars['ISOString']['output'];
  Markdown: Scalars['Markdown']['output'];
  Mutation: {};
  Note: NoteResponse;
  Boolean: Scalars['Boolean']['output'];
  NoteConnection: NoteConnectionModel;
  Int: Scalars['Int']['output'];
  NoteEdge: Omit<NoteEdge, 'node'> & { node?: Maybe<ResolversParentTypes['Note']> };
  NoteFilterInput: NoteFilterInput;
  NoteSortInput: NoteSortInput;
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  ProseMirrorJson: Scalars['ProseMirrorJson']['output'];
  Query: {};
  SavedItem: SavedItemModel;
  SavedItemNoteFilterInput: SavedItemNoteFilterInput;
  ValidUrl: Scalars['ValidUrl']['output'];
}>;

export interface IsoStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOString'], any> {
  name: 'ISOString';
}

export interface MarkdownScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Markdown'], any> {
  name: 'Markdown';
}

export type MutationResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  archiveNote?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationArchiveNoteArgs, 'input'>>;
  createNote?: Resolver<ResolversTypes['Note'], ParentType, ContextType, RequireFields<MutationCreateNoteArgs, 'input'>>;
  createNoteMarkdown?: Resolver<ResolversTypes['Note'], ParentType, ContextType, RequireFields<MutationCreateNoteMarkdownArgs, 'input'>>;
  deleteNote?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteNoteArgs, 'input'>>;
  editNoteContent?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationEditNoteContentArgs, 'input'>>;
  editNoteContentMarkdown?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationEditNoteContentMarkdownArgs, 'input'>>;
  editNoteTitle?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationEditNoteTitleArgs, 'input'>>;
  unArchiveNote?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<MutationUnArchiveNoteArgs, 'input'>>;
}>;

export type NoteResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Note'] = ResolversParentTypes['Note']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Note']>, { __typename: 'Note' } & GraphQLRecursivePick<ParentType, {"id":true}>, ContextType>;
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  contentPreview?: Resolver<Maybe<ResolversTypes['Markdown']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['ISOString'], ParentType, ContextType>;
  deleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  docContent?: Resolver<Maybe<ResolversTypes['ProseMirrorJson']>, ParentType, ContextType>;
  docMarkdown?: Resolver<Maybe<ResolversTypes['Markdown']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  savedItem?: Resolver<Maybe<ResolversTypes['SavedItem']>, ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['ValidUrl']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['ISOString'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NoteConnectionResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['NoteConnection'] = ResolversParentTypes['NoteConnection']> = ResolversObject<{
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['NoteEdge']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NoteEdgeResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['NoteEdge'] = ResolversParentTypes['NoteEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PageInfoResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ProseMirrorJsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ProseMirrorJson'], any> {
  name: 'ProseMirrorJson';
}

export type QueryResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  note?: Resolver<Maybe<ResolversTypes['Note']>, ParentType, ContextType, RequireFields<QueryNoteArgs, 'id'>>;
  notes?: Resolver<Maybe<ResolversTypes['NoteConnection']>, ParentType, ContextType, Partial<QueryNotesArgs>>;
}>;

export type SavedItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['SavedItem'] = ResolversParentTypes['SavedItem']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['SavedItem']>, { __typename: 'SavedItem' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;
  notes?: Resolver<ResolversTypes['NoteConnection'], ParentType, ContextType, Partial<SavedItemNotesArgs>>;
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
  NoteConnection?: NoteConnectionResolvers<ContextType>;
  NoteEdge?: NoteEdgeResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  ProseMirrorJson?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  SavedItem?: SavedItemResolvers<ContextType>;
  ValidUrl?: GraphQLScalarType;
}>;

