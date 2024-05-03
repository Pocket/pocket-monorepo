import { PocketSaveStatus } from '../types/index.js';

export type RawListResult = {
  api_id: string;
  api_id_updated: number;
  favorite: number;
  given_url: string;
  item_id: number;
  resolved_id: number;
  status: number;
  time_added: Date;
  time_favorited: Date;
  time_read: Date;
  time_updated: Date;
  title: string;
  user_id: number;
};

export type ListResult = {
  api_id: string;
  api_id_updated: number;
  favorite: number;
  given_url: string;
  item_id: number;
  resolved_id: number;
  status: keyof typeof PocketSaveStatus;
  time_added: Date;
  time_favorited: Date;
  time_read: Date;
  time_updated: Date;
  title: string;
  user_id: number;
};

export type UpdateField = {
  time_updated: string; // Timestamp string
  api_id_updated: string;
};

export type ListArchiveUpdate = UpdateField & {
  status: PocketSaveStatus;
  time_read: string; // Timestamp string
};

export type ListFavoriteUpdate = UpdateField & {
  favorite: FavoriteStatus;
  time_favorited: string; // Timestamp string
};

export enum FavoriteStatus {
  FAVORITE = 1,
  UNFAVORITE = 0,
}
