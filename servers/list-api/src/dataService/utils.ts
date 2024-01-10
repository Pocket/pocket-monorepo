import { DateTime } from 'luxon';

/**
 * Convert date object to timestamp as a string (yyyy-MM-dd HH:mm:ss)
 * localized to a time zone.
 * Used for database timestamp strings in text columns
 * (e.g. users_meta.value)
 * @param timestamp the date object to localize and return as string
 * @param tz the timezone string for the timezone
 */
export function mysqlTimeString(timestamp: Date, tz: string): string {
  const dt = DateTime.fromMillis(timestamp.getTime()).setZone(tz);
  return dt.toFormat('yyyy-MM-dd HH:mm:ss');
}

/**
 * Convert MySQL Date fields to Typescript Date objects
 * or null if the MySQL Date field is invalied for Typescript Dates
 * (e.g. "0000-00-00 00:00:00").
 * @param mysqlDate the date value from MySQL (could be Date, NaN, or string)
 */
export function mysqlDateConvert(mysqlDate: Date | string | null): Date | null {
  if (mysqlDate instanceof Date && !isNaN(mysqlDate.getTime())) {
    return mysqlDate;
  }
  return null;
}

/**
 * Extract unique values from an array of strings or numbers
 * @param input an array which might contain non-unique values
 * @returns the unique values of `input`
 */
export function uniqueArray<T extends string | number>(input: T[]): T[] {
  return Array.from(new Set(input));
}

/**
 * Set difference, `base` - `compare`; return an array of all elements
 * present in `base` but not in `compare`.
 * @param base the Set to compute difference on
 * @param compare the Set to compare to base
 **/
export function setDifference<T>(base: Set<T>, compare: Set<T>): Array<T> {
  return Array.from(base).filter((elem) => !compare.has(elem));
}
