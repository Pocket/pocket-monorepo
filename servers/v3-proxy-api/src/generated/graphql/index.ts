/**
 * Patching the query types... Specifically, the `id` field being non-nullable
 * in the schema is causing the computed queries which may include the
 * AccountData fragment to require `user.id`, even though the @includes
 * directive means that it should be considered Partial.
 * This breaks all the types.
 * Perhaps we can create a plugin but this is not a high-velocity set of
 * graphql queries, so just do them manually for now.
 * */

import {
  SavedItemsCompleteQuery,
  SavedItemsSimpleQuery,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsSimpleQuery,
} from './types';
export type SavedItemsCompleteQueryOverride = Omit<
  SavedItemsCompleteQuery,
  'user'
> & { user?: Omit<SavedItemsCompleteQuery['user'], 'id'> & { id?: string } };
export type SavedItemsSimpleQueryOverride = Omit<
  SavedItemsSimpleQuery,
  'user'
> & {
  user?: Omit<SavedItemsSimpleQuery['user'], 'id'> & { id?: string };
};
export type SearchSavedItemsCompleteQueryOverride = Omit<
  SearchSavedItemsCompleteQuery,
  'user'
> & {
  user?: Omit<SearchSavedItemsCompleteQuery['user'], 'id'> & { id?: string };
};
export type SearchSavedItemsSimpleQueryOverride = Omit<
  SearchSavedItemsSimpleQuery,
  'user'
> & {
  user?: Omit<SearchSavedItemsSimpleQuery['user'], 'id'> & { id?: string };
};

export * from './types';
export {
  SearchSavedItemsCompleteQueryOverride as SearchSavedItemsCompleteQuery,
  SearchSavedItemsSimpleQueryOverride as SearchSavedItemsSimpleQuery,
  SavedItemsCompleteQueryOverride as SavedItemsCompleteQuery,
  SavedItemsSimpleQueryOverride as SavedItemsSimpleQuery,
};
