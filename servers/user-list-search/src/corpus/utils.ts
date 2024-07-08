/**
 * Return just the date portion of an ISO-formatted
 * timestamp string, from a Date object
 */
export function toISODate(date: Date) {
  return date.toISOString().split('T')[0];
}
