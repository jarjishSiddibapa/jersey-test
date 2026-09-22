export function daysAgoIso(days: number, fromMs: number = Date.now()): string {
  return new Date(fromMs - days * 24 * 60 * 60 * 1000).toISOString();
}

export function minutesAgoIso(minutes: number, fromMs: number = Date.now()): string {
  return new Date(fromMs - minutes * 60 * 1000).toISOString();
}
