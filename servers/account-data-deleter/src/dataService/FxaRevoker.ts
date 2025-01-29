import { Knex } from 'knex';
import { readClient, writeClient } from './clients';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
import fetchRetry from 'fetch-retry';
import { config } from '../config';
const newFetch = fetchRetry(fetch);

export class FxaRevoker {
  private write: Knex;
  private read: Knex;
  constructor(private readonly userId: string) {
    this.write = writeClient();
    this.read = readClient();
  }

  /**
   * Get the current FxA access token for a user, to be
   * revoked during the account deletion process. We delete
   * all records of auth creds in the account deletion process.
   * This will notify Mozilla Accounts to remove Pocket from
   * the integrated apps, so it no longer shows up on the
   * account overview page.
   */
  async fetchAccessToken(): Promise<string | undefined> {
    const token = await this.read('user_firefox_account')
      .where({
        user_id: this.userId,
      })
      .pluck('firefox_access_token');
    // The length assertion is technically unnecessary since
    // user_id is the PK on this table
    if (token != null && token.length === 1) {
      return token[0];
    } else {
      return undefined;
    }
  }

  /**
   * Revoke an FxA access token, removing Pocket from integrated
   * apps in Mozilla account, and delete the database record
   * associated with Mozilla auth.
   * @returns true if successful, false otherwise
   */
  async revokeToken(): Promise<boolean> {
    try {
      const token = await this.fetchAccessToken();
      // No FxA account data exists (old, unmigrated accounts)
      if (token == null) {
        return true;
      } else {
        const res = await this.requestRevokeToken(token);
        if (!res.ok) {
          throw new Error(
            `Failed to revoke FxA access token [${res.status} - ${res.statusText}]`,
          );
        }
        await this.deleteAuthRecord();
        return true;
      }
    } catch (error) {
      serverLogger.error({
        message: 'Failed to revoke and/or delete FxA access token',
        errorData: error,
        errorMessage: error.message,
        userId: this.userId,
      });
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Make a request to the oauth endpoint to revoke FxA access token
   * @param token the token to revoke
   * @returns
   */
  async requestRevokeToken(token: string): Promise<Response> {
    const body = {
      client_id: config.fxa.clientId,
      client_secret: config.fxa.secret,
      token,
      token_type_hint: 'access_token',
    };
    const fetchPath = `${config.fxa.oauthEndpoint}${config.fxa.version}/oauth/destroy`;
    return newFetch(fetchPath, {
      retryOn: [500, 502, 503],
      retryDelay: (attempt, error, response) => {
        return Math.pow(2, attempt) * 500;
      },
      retries: 3,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Delete the auth record in Pocket's DB
   */
  async deleteAuthRecord(): Promise<number> {
    return await this.write('user_firefox_account')
      .where({ user_id: this.userId })
      .del();
  }
}
