/**
 * Get a unix timestamp from javascript date object or the current unix timestamp
 * @param date
 */
export function getUnixTimestamp(date?: Date) {
  return Math.round((date ?? new Date()).getTime() / 1000);
}
