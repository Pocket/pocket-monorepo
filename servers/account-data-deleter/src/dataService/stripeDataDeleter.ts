import { Knex } from 'knex';
import { readClient, writeClient, stripeClient } from './clients';
import Stripe from 'stripe';
import * as Sentry from '@sentry/node';
import { config } from '../config';
import Logger from '../logger';

export class StripeDataDeleter {
  private write: Knex;
  private read: Knex;
  readonly stripeClient: Stripe;
  /**
   * Delete customer data from Stripe and from Pocket's internal DB
   * Used when a Pocket account is deleted.
   * @param userId The Pocket account userId
   */
  constructor(private readonly userId: string) {
    this.write = writeClient();
    this.read = readClient();
    this.stripeClient = stripeClient();
  }
  /**
   * Delete user data from Stripe and from Pocket's internal database.
   * Used when a user deletes their account.
   */
  public async removeCustomer(): Promise<void> {
    const stripeIds = await this.fetchStripeCustomers();
    const deletedIds = await this.deleteStripeCustomers(stripeIds);
    if (deletedIds.length) {
      await this.deletePaymentDbData();
    }
  }

  /**
   * Make a request to delete stripe customer data
   * @param stripeIds array of stripe customer IDs to delete
   * @returns an array of successfully deleted IDs -- any IDs
   * that failed are logged to Cloudwatch and Sentry with
   * the failure reason. Only the successfully deleted IDs
   * are returned (including NOT_FOUND, as that means that the
   * customerId is already deleted). Only successfully deleted
   * IDs are returned so that they can be removed from Pocket's
   * database map; we don't want to purge unsuccessfully deleted
   * IDs so that it is easier to replay the accountDelete event
   * if a transient error is encountered (unusual).
   */
  async deleteStripeCustomers(stripeIds: string[]): Promise<string[]> {
    const successes = [];
    for await (const id of stripeIds) {
      try {
        const subcription = await this.stripeClient.subscriptions.retrieve(id);
        const deleteCustomer = await this.stripeClient.customers.del(
          subcription.customer.toString(),
        );
        successes.push(deleteCustomer.id);
      } catch (error) {
        if (error.code === 'resource_missing') {
          successes.push(id);
        } else {
          const errorMessage =
            'deleteStripeCustomers: Error deleting Stripe data';
          const errorData = {
            stripeId: id,
            userIOd: this.userId,
          };
          Logger.error({
            message: errorMessage,
            error: error,
            data: errorData,
          });
          Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
          Sentry.captureException(error);
        }
      }
    }
    return successes;
  }

  /**
   * Fetch all stripe IDs associated with a Pocket account
   * @returns array of stripe ids associated with a Pocket account
   */
  async fetchStripeCustomers(): Promise<string[]> {
    const stripeIds = await this.read('payment_subscriptions')
      .where({ user_id: this.userId, product_id: config.stripe.productId })
      .pluck('vendor_id');
    return stripeIds;
  }

  /**
   * Delete records in Pocket's payment table associated with
   * a Pocket account
   */
  async deletePaymentDbData() {
    return await this.write('payment_subscriptions')
      .where({ user_id: this.userId })
      .del();
  }
}
