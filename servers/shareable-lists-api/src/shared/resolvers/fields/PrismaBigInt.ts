import * as Sentry from '@sentry/node';

/**
 * Return a Number.
 * Prisma returns a String when it retrieves the BigInt value stored in
 * the datastore (by appending a "n" char to the value).
 *
 * @param parent
 * @param args
 * @param context
 * @param info
 * @constructor
 */
export const PrismaBigIntResolver = (parent, args, context, info) => {
  return parseFieldToInt(parent[info.fieldName]);
};

export function parseFieldToInt(field: string): number {
  const parsedField = parseInt(field);
  // if for some reason the value is corrupt in the db, log to Sentry
  if (!field || isNaN(parsedField)) {
    Sentry.captureException('Failed to parse itemId');
    return null;
  }
  return parsedField;
}
