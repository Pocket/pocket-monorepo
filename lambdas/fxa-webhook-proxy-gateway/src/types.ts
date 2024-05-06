export enum EVENT {
  APPLE_MIGRATION = 'apple_migration',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
  USER_DELETE = 'user_delete',
}

/**
 * event triggered by fxa for migrating apple users
 * from pocket sso auth to fxa auth.
 */
export type AppleMigrationSqsEvent = {
  fxa_user_id: string;
  event: EVENT.APPLE_MIGRATION;
  user_email: string;
  transfer_sub: string;
  timestamp: number;
};

export type UserDeleteSqsEvent = {
  user_id: string;
  event: EVENT.USER_DELETE;
  timestamp: number;
};

/**
 * This event type might contain an user email property in the payload
 * indicating a email updated event. See FxA Event Payload below.
 */
export type ProfileUpdatedSqsEvent = {
  user_id: string;
  event: EVENT.PROFILE_UPDATE;
  timestamp: number;
  user_email?: string;
};

export type SqsEvent =
  | UserDeleteSqsEvent
  | ProfileUpdatedSqsEvent
  | AppleMigrationSqsEvent;

/**
 * FxA Event Payload
 * Example profile change event:
 *   "https://schemas.accounts.firefox.com/event/profile-change": {
 *      "email": "example@mozilla.com"
 *   }
 * Example delete profile event:
 *  "https://schemas.accounts.firefox.com/event/delete-user": {}
 */
type FxaEvent = {
  [key: string]: Record<string, any>;
};
export type FxaPayload = {
  sub: string;
  events: FxaEvent;
};

/**
 * The type below is sourced from: "https://accounts.firefox.com/.well-known/openid-configuration"
 */
export type FxaOpenIdConfigPayload = {
  authorization_endpoint: string;
  introspection_endpoint: string;
  issuer: string;
  jwks_uri: string;
  revocation_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  verify_endpoint: string;

  claims_supported: string[];
  id_token_signing_alg_values_supported: string[];
  response_types_supported: string[];
  scopes_supported: string[];
  subject_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
};
