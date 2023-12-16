import { setTimeout } from 'timers/promises';
import { DateTime } from 'luxon';

/**
 * Exponential backoff with full jitter.
 * @param tries number of re(tries). Used for exonential backoff
 * calculation
 * @param cap Backoff time cap, in ms. Will not back off any
 * longer than this value
 */
export async function backoff(tries: number, cap: number) {
  const maxWait = Math.min(cap, 2 ** tries * 100);
  // Pick random number from set [0, maxWait]
  const jitterWait = Math.floor(Math.random() * (maxWait + 1) + 0);
  await setTimeout(jitterWait);
}

/**
 * Convert date object to timestamp as a string (yyyy-MM-dd HH:mm:ss)
 * localized to a time zone.
 * Used for database timestamp strings in text columns
 * (e.g. users_meta.value)
 * @param timestamp the date object to localize and return as string
 * @param tz the timezone string for the timezone
 */
export function mysqlTimeString(timestamp: Date, tz?: string): string {
  const dt = DateTime.fromMillis(timestamp.getTime());
  if (tz) dt.setZone(tz);
  return dt.toFormat('yyyy-MM-dd HH:mm:ss');
}
