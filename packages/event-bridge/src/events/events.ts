/**
 * The Pocket event types that are supported by the event bridge
 *
 * NOTE: If you add an event type here, you must also add it to the PocketEventTypeMap in index.ts and in the PocketEvent Union type
 */
export enum PocketEventType {
  ACCOUNT_DELETION = 'account-deletion', //source: user-event
  ACCOUNT_EMAIL_UPDATED = 'account-email-updated', // source: user-event
  PREMIUM_PURCHASE = 'Premium Purchase', //source: web-repo
  ACCOUNT_REGISTRATION = 'User Registration', //source: web-repo
  FORGOT_PASSWORD = 'Forgot Password Request', //source: web-repo
  EXPORT_READY = 'list-export-ready', // source: account-data-deleter
}
