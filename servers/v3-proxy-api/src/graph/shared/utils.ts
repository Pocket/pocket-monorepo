export function epochSecondsToISOString(secs: number): string {
  return new Date(secs * 1000).toISOString();
}
