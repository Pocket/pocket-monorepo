export type ListItem = {
  object_version: 'new';
  url: string;
  item_id: number;
  status:
    | 'unread'
    | 'archived'
    | 'deleted'
    | 'pending'
    | 'pending_hidden'
    | 'hidden'
    | 'not_in_list';
  is_favorited: boolean;
  tags: string[];
  created_at: number;
};

export type ListItemUpdate = {
  trigger:
    | 'save'
    | 'archive'
    | 'unarchive'
    | 'delete'
    | 'favorite'
    | 'unfavorite'
    | 'tags_update';
};

export type Content = {
  url: string;
  item_id?: number;
};

export type User = {
  email?: string;
  guid?: number;
  hashed_guid?: string;
  user_id?: number;
  hashed_user_id?: string;
};

export type ApiUser = {
  api_id: number;
  name?: string;
  is_native?: boolean;
  is_trusted?: boolean;
  client_version?: string;
};
