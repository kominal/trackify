export const DEFAULT_TIME_ZONE = 'Europe/Berlin';

export function isValidTimeZone(timeZone: string | undefined): timeZone is string {
  if (!timeZone) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function parts(date: Date, timeZone: string): Record<string, number> {
  const formatted = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  return Object.fromEntries(formatted.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
}

// Offset of the time zone from UTC at the given instant, in milliseconds (Berlin in winter: +3600000).
export function offsetOf(date: Date, timeZone: string): number {
  const p = parts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// Calendar day (YYYY-MM-DD) of the instant in the time zone.
export function dayKey(date: Date | number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

// The instant the given calendar day (YYYY-MM-DD) starts in the time zone.
export function startOfDay(day: string, timeZone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, date);
  // Two passes settle days on which the offset changes (the offset at midnight is what counts).
  let instant = guess - offsetOf(new Date(guess), timeZone);
  instant = guess - offsetOf(new Date(instant), timeZone);
  return new Date(instant);
}

export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

// Calendar days touched by [from, to) in the time zone, in order.
export function daysBetween(from: Date, to: Date, timeZone: string): string[] {
  const days: string[] = [];
  const last = dayKey(new Date(to.getTime() - 1), timeZone);
  for (let day = dayKey(from, timeZone); day <= last; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}
