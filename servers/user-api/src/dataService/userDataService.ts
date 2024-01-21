import { Knex } from 'knex';
import { IContext } from '../context';
import { User } from '../types';
import * as Sentry from '@sentry/node';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import { normalizeEmail, contactHash } from '../utils/email';
import { getUnixTimestamp } from '../utils/unixTimestamp';
import { DateTime } from 'luxon';
import { serverLogger } from '@pocket-tools/ts-logger';
import config from '../config';

/** Database constants for some lookups; inferred from web repo */
const constants = {
  usersMetaSettingsUpdateProperty: 38, // users_meta.property
  usersServicesIdEmail: 2, // users_services.service_id
  emailNotifyServiceId: 3, // users_tokens.service_id
  contactHashEmailType: 1, // contact_hashes.type
};

type AuthUser = {
  id: number;
};

/**
 * A fresh instance of this class should be made for every request.
 */
export class UserDataService {
  private context: IContext;
  public readonly userId: string;

  constructor(context: IContext, userId: string) {
    this.context = context;
    this.userId = userId;
  }

  get readDb(): Knex {
    return this.context.db.readClient;
  }

  get writeDb(): Knex {
    return this.context.db.writeClient;
  }

  /**
   * Alternate async constructor method from FxA ID
   * instead of Pocket User ID. Sets userId to the
   * Pocket UserID value.
   * @throws NotFoundError if the userId doesn't exist for the fxaId
   */
  public static async fromFxaId(
    context: IContext,
    fxaId: string,
  ): Promise<UserDataService> {
    const userId = await UserDataService.fetchFxaIdFromUserId(
      context.db.readClient,
      fxaId,
    );
    if (userId == null) {
      throw new NotFoundError(`userId doesnt exist for given fxaId ${fxaId}`);
    }
    return new UserDataService(context, userId);
  }

  /**
   * Fetch the Pocket internal userId given the FxA ID
   */
  private static async fetchFxaIdFromUserId(
    db: Knex,
    fxaId: string,
  ): Promise<string | null> {
    Sentry.addBreadcrumb({
      message: 'Retrieving Pocket userId from FxA ID',
    });
    const userResult = await db('user_firefox_account')
      .select('user_id')
      .where({ firefox_uid: fxaId });
    return userResult.length > 0 ? userResult[0]['user_id'].toString() : null;
  }

  public getUserData(): Promise<User> {
    Sentry.addBreadcrumb({ message: 'Fetching user data' });
    return this.fetchUserData()
      .then((userData: any): User => {
        return userData as User;
      })
      .catch((error) => {
        serverLogger.error('Fetching user data', {
          userId: this.userId,
          message: error.message,
          headers: this.context.headers,
        });
        throw error;
      });
  }

  /**
   * Validate the accessToken
   * @param accessToken
   */
  public async validateAccessToken(accessToken: string): Promise<boolean> {
    Sentry.addBreadcrumb({
      message: 'Validating oauth access token for user',
    });
    const userAccessResult = await this.readDb('oauth_user_access')
      .select('user_id')
      .where({ access_token: accessToken });

    return (
      userAccessResult.length &&
      parseInt(userAccessResult[0]['user_id']) === parseInt(this.userId)
    );
  }

  /**
   * Query the database for user data
   */
  private async fetchUserData(): Promise<any> {
    return this.readDb('users')
      .select(
        'email',
        this.readDb.raw(`IF(premium_status = 1, TRUE, FALSE) as isPremium`),
        this.readDb.raw(
          `IF(user_firefox_account.firefox_uid IS NULL, FALSE, TRUE) as isFxa`,
        ),
        'users.birth as accountCreationDate',
        'description',
        'avatar_url as avatarUrl',
        'name',
        'first_name as firstName',
        'last_name as lastName',
        'users.user_id as id',
        'username',
      )
      .where('users.user_id', this.userId)
      .leftOuterJoin('user_profile', 'user_profile.user_id', 'users.user_id')
      .leftOuterJoin(
        'user_firefox_account',
        'user_firefox_account.user_id',
        'users.user_id',
      )
      .first();
  }

  /**
   * Delete PII from readitla_auth database.
   * Requires some lookups to ensure all PII is deleted (can't just
   * rely on user_id)
   */
  private async deleteAuthPII(authId: number | null, trx: Knex.Transaction) {
    if (authId == null) {
      return;
    }
    const user = await trx<AuthUser>('readitla_auth.users')
      .select()
      .where({ id: authId })
      .first();
    if (user) {
      await trx('readitla_auth.user_providers').delete().where({ id: user.id });
      await trx('readitla_auth.users').delete().where({ id: authId });
    }
  }

  /**
   * delete all PII information for a given user Id
   * @param userId: pocket user Id
   */
  public async deletePIIUserInfo(userId: string): Promise<void> {
    Sentry.addBreadcrumb({ message: 'Deleting user PII from Pocket DB' });
    const tables = config.database.userPIITables;
    const id = parseInt(userId);
    // Must fetch ID before deleting users entry for readitla_auth
    const authId = await this.readDb('users')
      .select('auth_user_id')
      .where({ user_id: id })
      .first()
      .then((row) => row.auth_user_id);
    await this.writeDb.transaction(async (trx) => {
      await this.deleteAuthPII(authId, trx);
      await Promise.all(
        Object.entries(tables).flatMap(([key, tables]) => {
          return tables.map((tableName) => {
            return trx(tableName)
              .delete()
              .where({
                [key]: id,
              });
          });
        }),
      );
    });
  }

  /**
   * expire user web session
   * updates status to 0 for a given userId
   */
  public async expireUserWebSession() {
    Sentry.addBreadcrumb({ message: 'Expiring user web session' });
    return await this.writeDb('user_web_session_tokens')
      .update({
        status: 0,
        time_expired: new Date(),
      })
      .where('user_id', this.userId);
  }

  /**
   * Check if email is available for use by user, if it's unique
   * in our database.
   * Lazily cache result
   * @param email email address to check
   * @returns true if email is unique, else false
   */
  private async isEmailUnique(email: string): Promise<boolean> {
    const aliasCount = await this.readDb('users_services')
      .where({
        service_id: constants.usersServicesIdEmail,
        username: email,
      })
      .limit(1)
      .pluck('username')
      .then((_) => _.length);
    const emailCount = await this.readDb('users')
      .where({ email: email })
      .pluck('email')
      .limit(1)
      .then((_) => _.length);
    return aliasCount + emailCount > 0;
  }

  /** Get the user's primary email address */
  async userEmail(): Promise<string> {
    const oldEmail: string = await this.readDb('users')
      .where({ user_id: this.userId })
      .pluck('email')
      .then((_) => _[0]); // userID is primary key and must have a record
    return oldEmail;
  }

  /**
   * Normalizes email and validates uniqueness.
   * @param email email address to validate and normalize
   * @returns
   */
  async validateEmail(email): Promise<string> {
    const normEmail = normalizeEmail(email);
    if (!this.isEmailUnique(email)) {
      throw new Error(
        'User email address cannot be updated as the desired email already exists.',
      );
    }
    return normEmail;
  }

  /**
   * Update a user's email with the provided email address.
   * Prior to calling this function, the new email address should
   * be normalized and validated.
   * Normalizes and validates the email (lowercase), and checks
   * if the requested email is available (not in use by another user).
   * TODO: Delete values from cache (see https://getpocket.atlassian.net/l/c/EwHKSnk1)
   * @param updatedEmail new email address for Pocket user
   * @param autoConfirm whether to 'auto-confirm' the email. If 1, a
   * confirmation email will not be sent to the user's email address.
   * Do this if coming from a trusted source, like via Firefox account
   * integration.
   * @throws Error if email address is invalid or not unique, database
   * error if transaction fails
   */
  async updateUserEmail(email: string, autoConfirm = false): Promise<void> {
    const oldEmail = await this.userEmail();

    Sentry.addBreadcrumb({
      message: 'Starting transaction for updating user email',
    });

    // TODO: Delete cache values
    // See https://getpocket.atlassian.net/l/c/EwHKSnk1
    return this.writeDb.transaction(async (trx) => {
      await trx('users').update({ email: email }).where('user_id', this.userId);
      await trx('users_services')
        .insert({
          user_id: this.userId,
          service_id: constants.usersServicesIdEmail,
          username: email,
          confirmed: +autoConfirm, // cast to int
        })
        .onConflict()
        .ignore();
      await trx('newsletter_subscribers')
        .update({ email: email })
        .where('user_id', this.userId);
      // register contact_hashes
      // contactType = 1 for email
      const hashedContact = contactHash(email, 1);
      await trx('contact_hashes')
        .insert({
          contact_hash: hashedContact,
          type: constants.contactHashEmailType,
          user_id: this.userId,
          confirmed: +autoConfirm,
          time_updated: getUnixTimestamp(), // int type in DB
        })
        .onConflict()
        .merge(); // equivalent to ON DUPLICATE KEY UPDATE
      // Set status to 0 for token associated with old email record
      await trx('users_tokens')
        .update({ status: 0 })
        .where('token', oldEmail)
        .andWhere('service_id', constants.emailNotifyServiceId) // SERVICE_NOTIFY_EMAIL
        .andWhere('user_id', this.userId);
      // Create users tokens record for new email
      await trx('users_tokens')
        .insert({
          token: email,
          service_id: constants.emailNotifyServiceId,
          user_id: this.userId,
          status: 1,
        })
        .onConflict() // primary key is combined index of token, service_id, user_id
        .merge();
      // Add record in users_meta to indicate settings update
      // Delete prior records of updates (legacy behavior, idk exactly why)
      await trx('users_meta')
        .where('user_id', this.userId)
        .andWhere('property', constants.usersMetaSettingsUpdateProperty) // Last time settings updated
        .del();
      // 'value' in users_meta is sometimes a time string depending on property;
      // this is used as a sort key rather than an actual datapoint, so it can
      // be relative, but has to be consistent. It is a timestamp string in
      // central time with format 'Y-m-d H:i:s' (e.g. 2021-12-12 12:12:12)
      const currentTimeString = DateTime.fromMillis(new Date().getTime())
        .setZone(config.database.tz)
        .toFormat('yyyy-MM-dd HH:mm:ss');
      await trx('users_meta').insert({
        user_id: this.userId,
        property: constants.usersMetaSettingsUpdateProperty,
        value: currentTimeString,
        time_updated: trx.fn.now(),
      });
    });
  }

  /**
   * used for apple user migration.
   * tear down code after migration is complete.
   * Get pocket userId from transferSub
   * @param transferSub transfer sub that's pre-generated and stored in database.
   */
  public static async getPocketIdByTransferSub(
    context: IContext,
    transferSub: string,
  ): Promise<string> {
    const userResult = await context.db
      .readClient('readitla_ril-tmp.apple_migration')
      .select('user_id')
      .where({ transfer_sub: transferSub });
    return userResult.length > 0 ? userResult[0]['user_id'].toString() : null;
  }

  /**
   * built for apple migration.
   * tear down code after migration is complete.
   * copy paste from updateUserEmail, can modify/comment out as needed.
   * Note: context userId might not exist.
   * so using userId from args
   * @param email
   * @param autoConfirm
   */
  public async updateUserEmailByPocketId(
    email: string,
    pocketUserId: string,
    autoConfirm = false,
  ): Promise<void> {
    Sentry.addBreadcrumb({
      message: 'Starting transaction for updating user email',
    });

    // TODO: Delete cache values
    // See https://getpocket.atlassian.net/l/c/EwHKSnk1
    return this.writeDb.transaction(async (trx) => {
      await trx('users')
        .update({ email: email })
        .where('user_id', pocketUserId);
      await trx('users_services')
        .insert({
          user_id: pocketUserId,
          service_id: constants.usersServicesIdEmail,
          username: email,
          confirmed: +autoConfirm, // cast to int
        })
        .onConflict()
        .ignore();
      await trx('newsletter_subscribers')
        .update({ email: email })
        .where('user_id', pocketUserId);
      // register contact_hashes
      // contactType = 1 for email
      const hashedContact = contactHash(email, 1);
      await trx('contact_hashes')
        .insert({
          contact_hash: hashedContact,
          type: constants.contactHashEmailType,
          user_id: pocketUserId,
          confirmed: +autoConfirm,
          time_updated: getUnixTimestamp(), // int type in DB
        })
        .onConflict()
        .merge(); // equivalent to ON DUPLICATE KEY UPDATE

      //Set status to 0 for token associated with old email record
      const oldEmail = await this.userEmail();
      await trx('users_tokens')
        .update({ status: 0 })
        .where('token', oldEmail)
        .andWhere('service_id', constants.emailNotifyServiceId) // SERVICE_NOTIFY_EMAIL
        .andWhere('user_id', this.userId);
      // Create users tokens record for new email
      await trx('users_tokens')
        .insert({
          token: email,
          service_id: constants.emailNotifyServiceId,
          user_id: pocketUserId,
          status: 1,
        })
        .onConflict() // primary key is combined index of token, service_id, user_id
        .merge();

      // Add record in users_meta to indicate settings update
      // Delete prior records of updates (legacy behavior, idk exactly why)
      await trx('users_meta')
        .where('user_id', pocketUserId)
        .andWhere('property', constants.usersMetaSettingsUpdateProperty) // Last time settings updated
        .del();
      // 'value' in users_meta is sometimes a time string depending on property;
      // this is used as a sort key rather than an actual datapoint, so it can
      // be relative, but has to be consistent. It is a timestamp string in
      // central time with format 'Y-m-d H:i:s' (e.g. 2021-12-12 12:12:12)
      const currentTimeString = DateTime.fromMillis(new Date().getTime())
        .setZone(config.database.tz)
        .toFormat('yyyy-MM-dd HH:mm:ss');
      await trx('users_meta').insert({
        user_id: pocketUserId,
        property: constants.usersMetaSettingsUpdateProperty,
        value: currentTimeString,
        time_updated: trx.fn.now(),
      });
    });
  }

  /**
   * built for apple migration.
   * tear down code after migration is complete.
   * Note: context userId might not exist.
   * so using userId from args
   * @param newFirefoxUserId
   * @param pocketUserId
   */
  public async upsertFxaIdByPocketId(newFirefoxUserId, pocketUserId, email) {
    const updated = await this.writeDb('user_firefox_account')
      .update({
        firefox_uid: newFirefoxUserId,
        api_id: config.apple_migration_api_id,
        firefox_email: email,
      })
      .where('user_id', pocketUserId);

    if (updated == 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');
      const seconds = String(currentDate.getSeconds()).padStart(2, '0');
      const now = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      await this.writeDb('user_firefox_account')
        .insert({
          user_id: pocketUserId,
          firefox_uid: newFirefoxUserId,
          firefox_email: email,
          //firefox_access_token is not used anywhere in pocket context
          // setting a placeholder string for non-nullable value
          firefox_access_token: 'firefox-apple-migration',
          // This cannot be null but can be an empty string
          firefox_avatar: '',
          api_id: config.apple_migration_api_id,
          birth: now,
          updated_at: now,
          active: 1,
          last_auth_date: now,
        })
        .onConflict()
        .merge();
    }
  }

  /**
   * built for apple migration. tear down code
   * Note: context userId might not exist.
   * so using userId from args
   * @param pocketUserId
   */
  public async getPremiumStatusByPocketId(pocketUserId: number) {
    const result = await this.readDb('users')
      .select(
        this.readDb.raw(`IF(premium_status = 1, true, false) as isPremium`),
      )
      .where('user_id', pocketUserId);
    return result.length > 0 ? result[0]['isPremium'] : null;
  }

  public async markMigrationCompleted(transferSub: string) {
    return this.writeDb('apple_migration')
      .update('migrated', true)
      .where({ transfer_sub: transferSub });
  }
}
