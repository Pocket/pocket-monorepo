import { NoteSortBy } from '../__generated__/graphql';
import { Note as NoteEntity } from '../__generated__/db';

// Utilities for type-safety on mapped sort columns
type ReverseMap<T extends Record<keyof T, keyof any>> = {
  [K in keyof T as T[K]]: K;
};

export type ValidSortByField = keyof Pick<
  NoteEntity,
  'createdAt' | 'updatedAt'
>;

export type ValidSortByInput = {
  [Key in keyof ReverseMap<typeof NoteSortBy>]: ValidSortByField;
};

export const SortByInputMap: ValidSortByInput = {
  [NoteSortBy.CreatedAt]: 'createdAt',
  [NoteSortBy.UpdatedAt]: 'updatedAt',
};

// export type ValidNoteSortByInput = {
//   [NoteSortBy.CreatedAt]: 'createdAt';
//   [NoteSortBy.UpdatedAt]: 'updatedAt';
// };

// export type ValidNoteSortByField = ReverseMap<ValidNoteSortByInput>;
