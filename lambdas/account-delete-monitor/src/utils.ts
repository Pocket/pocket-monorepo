/**
 * Given the number of days a record should exist, compute the
 * timestamp (in seconds after epoch) after which the record should
 * be purged relative to current time. Utility for DynamoDB TTL attribute.
 * @param daysToLive number of days the record should exist
 * @returns epoch time in seconds after which the record is expired
 */
export function expirationTimestamp(daysToLive: number): number {
  const daysInSeconds = daysToLive * 24 * 60 * 60;
  const now = Math.round(new Date().getTime() / 1000);
  return now + daysInSeconds;
}

/**
 * Given an epoch timestamp in milliseconds, return the date
 * in an ISO-8601 string (date only)
 * @param ms epoch time in milliseconds
 * @returns ISO-formatted date
 */
export function epochMsToIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
