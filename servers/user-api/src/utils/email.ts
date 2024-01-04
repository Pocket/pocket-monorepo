import { UserInputError } from '@pocket-tools/apollo-utils';
import crypto from 'crypto';
import config from '../config';
/**
 * Validate and normalize an email address to be inserted into the DB
 * @param email the updated email address. Should be validated
 * and/or come from a trusted source.
 */
export function normalizeEmail(email: string): string {
  const badInputError = new UserInputError(
    `Bad email address provided for update: ${email}`,
  );

  const [name, domain, ...rest] = email.split('@').map((_) => _.toLowerCase());
  // Should split into exactly two parts
  if (!(name && domain) || rest.length > 0) {
    throw badInputError;
  }
  const normalizedEmail = `${name}@${domain}`;
  // Check for weird characters
  // This is copied from the Web repo
  const emailRegex = new RegExp(
    '^[_a-z0-9-+]+(.[_a-z0-9-+]+)*@[a-z0-9-]+(.[a-z0-9-]+)*(.[a-z]{2,30})$',
  );
  if (emailRegex.test(normalizedEmail) !== true) {
    throw badInputError;
  }
  return normalizedEmail;
}

/**
 * Hash contact + contact type values to store for DB lookup.
 * TS Port of web behavior 👇
 * https://github.com/Pocket/Web/blob/81b5e1116c9778daf8bff8f3fb321251f685d1b2/includes/functions_user_emails.php#L676
 * Web repo TODO comment: more normalization, make sure encoding are all consistent.
 *
 * @param contact A user's contact point, e.g. email address
 * @param contactType The type of contact (e.g email)
 * @throws Error if either contact or contactType is not truthy
 */
export function contactHash(contact: string, contactType: number): string {
  if (!contact || contactType == null) {
    throw new Error(
      'Tried to call `contactHash` with empty contact or contactType',
    );
  }
  const randomString = config.secrets.contactHash;
  const hash = crypto.createHash('sha256');
  const normalContact = contact.trim().toLowerCase();
  const contactString = `v1:${normalContact}:${contactType}:${randomString}`;
  return hash.update(contactString).digest('hex');
}
