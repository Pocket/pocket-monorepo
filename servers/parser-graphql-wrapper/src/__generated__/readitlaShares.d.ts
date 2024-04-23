import type { ColumnType } from 'kysely';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export interface ShareUrls {
  api_id: number;
  given_url: string;
  item_id: number;
  resolved_id: number;
  service_id: number;
  share_url_id: Generated<number>;
  time_generated: number;
  time_shared: number;
  user_id: number;
}

export interface DB {
  share_urls: ShareUrls;
}
