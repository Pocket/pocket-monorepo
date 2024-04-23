import type { ColumnType } from 'kysely';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export interface ItemsResolver {
  has_old_dupes: number;
  item_id: Generated<number>;
  normal_url: string;
  resolved_id: number;
  search_hash: string | null;
}

export interface DB {
  items_resolver: ItemsResolver;
}
