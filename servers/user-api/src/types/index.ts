export * as db from './database';

// The User Profile model
// Corresponds to user_profile table
export type UserProfile = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  name: string | null;
  description: string | null;
};

// The User model
// Contains all data for User
export type User = UserProfile & {
  email: string;
  isPremium: boolean;
  isFxa: boolean;
  firstName: string | null;
  lastName: string | null;
  accountCreationDate: string | null;
};

export enum ExpireUserWebSessionReason {
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  LOGOUT = 'LOGOUT',
}
