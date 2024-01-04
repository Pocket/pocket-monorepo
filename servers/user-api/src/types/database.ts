export type User = {
  user_id: number;
  feed_id: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  feed_protected: number;
  login_hash: string;
  birth: Date;
  last_syncer: string;
  api_id: number;
  premium_status: number;
  updated_at: Date;
  auth_user_id?: string;
};

export type UsersMeta = {
  user_id: number;
  property: number;
  value: string;
  time_updated: Date;
  updated_at: Date;
};

export type UserProfile = {
  user_id: number;
  username: string;
  name: string;
  description: string;
  avatar_url: string;
  follower_count: number;
  follow_count: number;
  post_count: number;
  data?: string;
  time_updated: number;
  updated_at: Date;
};

export type UserFirefoxAccount = {
  user_id: number;
  firefox_access_token: string;
  firefox_uid: string;
  firefox_email: string;
  firefox_avatar: string;
  birth: Date;
  api_id: number;
  last_auth_date?: Date;
  deauth_date?: Date;
  active: number;
  updated_at: Date;
};

export type OauthUserAccess = {
  user_id: number;
  consumer_key: string;
  access_token: string;
  permission: string;
  status: number;
};

export type UsersServices = {
  user_id: number;
  service_id: number;
  username: string;
  confirmed: number;
  updated_at: Date;
};

export type UsersTokens = {
  user_id: number;
  service_id: number;
  device_id: number;
  token: string;
  status: number;
};
