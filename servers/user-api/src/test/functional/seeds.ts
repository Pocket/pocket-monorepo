import { faker } from '@faker-js/faker';
import { db } from '../../types/index.js';
import { writeClient as conn } from '../../database/client.js';
import config from '../../config/index.js';

export async function truncatePiiTables() {
  const allTables = Object.entries(config.database.userPIITables).flatMap(
    ([_, tables]) => tables,
  );
  await Promise.all(
    allTables.map((table: string) => {
      return conn()(table).truncate();
    }),
  );
}

export async function PiiTableSeed(user_id: number, firefox_uid: string) {
  const specialTablesSeeds = {
    user_firefox_account: UserFirefoxAccountSeed({ user_id, firefox_uid }),
    oauth_user_access: OauthUserAccessSeed({ user_id }),
    user_profile: UserProfileSeed({ user_id }),
    users: UserSeed({ user_id }),
    users_services: UsersServicesSeed({ user_id }),
    users_tokens: UsersTokensSeed({ user_id }),
    user_google_account: { user_id, google_id: faker.string.uuid() },
  };

  await Promise.all(
    Object.entries(config.database.userPIITables).flatMap(([key, tables]) => {
      return tables.map((tableName) => {
        if (!(tableName in specialTablesSeeds)) {
          return conn()(tableName).insert({ [key]: user_id });
        } else {
          return conn()(tableName).insert(specialTablesSeeds[tableName]);
        }
      });
    }),
  );
}

export function UsersTokensSeed(
  input?: Partial<db.UsersTokens>,
): db.UsersTokens {
  return {
    user_id: faker.number.int(),
    service_id: faker.number.int({ max: 100 }),
    device_id: faker.number.int({ max: 100 }),
    token: faker.string.alphanumeric(50),
    status: faker.number.int({ max: 1 }),
    ...input,
  };
}

export function UsersServicesSeed(
  input?: Partial<db.UsersServices>,
): db.UsersServices {
  return {
    user_id: faker.number.int(),
    service_id: faker.number.int({ max: 100 }),
    username: faker.internet.userName().slice(100),
    confirmed: faker.number.int({ max: 1 }),
    updated_at: faker.date.recent(),
    ...input,
  };
}

export function OauthUserAccessSeed(
  input?: Partial<db.OauthUserAccess>,
): db.OauthUserAccess {
  return {
    user_id: faker.number.int(),
    consumer_key: faker.string.alphanumeric({ length: 20 }),
    access_token: faker.string.alphanumeric({ length: 20 }),
    permission: faker.string.alphanumeric({ length: 3 }),
    status: 1,
    ...input,
  };
}

export function UserSeed(input?: Partial<db.User>): db.User {
  return {
    user_id: faker.number.int(),
    feed_id: faker.string.alphanumeric({ length: 20 }),
    password: faker.string.alphanumeric({ length: 64 }),
    email: faker.internet.email(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    feed_protected: faker.number.int({ max: 1 }),
    login_hash: faker.string.alphanumeric({ length: 42 }),
    birth: faker.date.past(),
    last_syncer: faker.string.alphanumeric({ length: 42 }),
    api_id: faker.number.int({ max: 8388607 }),
    premium_status: faker.number.int({ max: 1 }),
    updated_at: faker.date.recent(),
    auth_user_id: faker.string.alphanumeric({ length: 10 }),
    ...input,
  };
}

export function UsersMetaSeed(input?: Partial<db.UsersMeta>): db.UsersMeta {
  return {
    user_id: faker.number.int(),
    property: faker.number.int({ max: 255 }),
    value: faker.string.alpha({ length: 10 }),
    time_updated: faker.date.recent(),
    updated_at: faker.date.recent(),
    ...input,
  };
}

export function UserProfileSeed(
  input?: Partial<db.UserProfile>,
): db.UserProfile {
  return {
    user_id: faker.number.int(),
    username: faker.internet.userName().slice(20),
    name: faker.person.fullName(),
    description: faker.lorem.sentences(),
    avatar_url: faker.internet.url(),
    follower_count: faker.number.int({ max: 100000 }),
    follow_count: faker.number.int({ max: 100000 }),
    post_count: faker.number.int({ max: 100000 }),
    data: faker.string.alphanumeric(),
    time_updated: faker.date.past().getTime() / 1000,
    updated_at: faker.date.past(),
    ...input,
  };
}

export function UserFirefoxAccountSeed(
  input?: Partial<db.UserFirefoxAccount>,
): db.UserFirefoxAccount {
  return {
    user_id: faker.number.int(),
    firefox_access_token: faker.string.alphanumeric({
      length: { min: 32, max: 300 },
    }),
    firefox_uid: faker.string.uuid(),
    firefox_email: faker.internet.email(),
    firefox_avatar: faker.internet.url(),
    birth: faker.date.past(),
    api_id: faker.number.int({ max: 8388607 }),
    last_auth_date: faker.date.recent(),
    deauth_date: null,
    active: 1,
    updated_at: faker.date.recent(),
    ...input,
  };
}
