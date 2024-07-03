/**
 * Infer whether a given timestamp is in milliseconds or
 * seconds, and convert it to seconds if milliseconds.
 * @param time an epoch timestamp (seconds/milliseconds)
 */
export function timeSeconds(time: number) {
  // Assume time is milliseconds if it's 13 digits or more
  // This will work until time in seconds has 13 digits (33658-09-37T01:46:40 UTC)
  // Which... I think is ok.
  // Our timestamps can't be older than 2001 so there's no issue
  // with supporting 12-digit milliseconds (999999999999 = 2001-09-09T01:46:39 UTC)
  return time.toString().length >= 13 ? Math.round(time / 1000) : time;
}
