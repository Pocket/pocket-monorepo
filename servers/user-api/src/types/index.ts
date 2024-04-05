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
  premiumStatus: PremiumStatus;
};

export enum PremiumStatus {
  NEVER = 'NEVER',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum PremiumFeature {
  PERMANENT_LIBRARY = 'PERMANENT_LIBRARY',
  SUGGESTED_TAGS = 'SUGGESTED_TAGS',
  PREMIUM_SEARCH = 'PREMIUM_SEARCH',
  ANNOTATIONS = 'ANNOTATIONS',
  AD_FREE = 'AD_FREE',
}

export enum ExpireUserWebSessionReason {
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  LOGOUT = 'LOGOUT',
}
