import { Knex } from 'knex';
import {
  UserSeed,
  UsersMetaSeed,
  UserFirefoxAccountSeed,
  UserProfileSeed,
} from './seeds';

/**
 * Helper function to seed data for testing update email mutations
 */
export async function seedEmailMutation(
  userId: number,
  fxaId: string,
  email: string,
  db: Knex,
): Promise<void> {
  const inputData = {
    users: UserSeed({ user_id: userId, email: email }),
    newsletter_subscribers: { user_id: userId, email: email },
    users_tokens: {
      user_id: userId,
      status: 1,
      token: email,
      service_id: 3,
    },
    users_meta: UsersMetaSeed({
      user_id: userId,
      property: 38,
      value: 'someValue',
    }),
    user_firefox_account: UserFirefoxAccountSeed({
      user_id: userId,
      firefox_uid: fxaId,
    }),
    user_profile: UserProfileSeed({ user_id: userId, username: 'chicory' }),
  };
  await Promise.all(
    Object.entries(inputData).map(([tableName, input]) =>
      db(tableName).insert(input),
    ),
  );
}
/**
 * Helper function to clear data for testing update email mutations
 */
export async function truncateEmailMutation(db: Knex): Promise<void> {
  const tables = [
    'users',
    'newsletter_subscribers',
    'users_tokens',
    'users_meta',
    'users_services',
    'contact_hashes',
    'user_firefox_account',
    'user_profile',
  ];
  await Promise.all(tables.map((tableName) => db(tableName).truncate()));
}
