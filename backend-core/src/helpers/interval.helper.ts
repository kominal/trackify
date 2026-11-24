export interface Interval {
  start: number;
  end: number;
}

export const MINUTE_MS = 60 * 1000;

// Sorted, non-overlapping cover of the given intervals; touching intervals are joined.
export function union(intervals: Interval[]): Interval[] {
  const sorted = intervals.filter(({ start, end }) => end > start).sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  for (const { start, end } of sorted) {
    const last = result[result.length - 1];
    if (last && start <= last.end) {
      last.end = Math.max(last.end, end);
    } else {
      result.push({ start, end });
    }
  }
  return result;
}

// Intersection of two unions (both sorted and non-overlapping, as returned by union()).
export function intersect(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);
    if (end > start) {
      result.push({ start, end });
    }
    if (a[i].end < b[j].end) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

// Parts of `a` not covered by `b` (both as returned by union()).
export function subtract(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const interval of a) {
    let cursor = interval.start;
    for (const cut of b) {
      if (cut.end <= cursor || cut.start >= interval.end) {
        continue;
      }
      if (cut.start > cursor) {
        result.push({ start: cursor, end: cut.start });
      }
      cursor = Math.max(cursor, cut.end);
    }
    if (cursor < interval.end) {
      result.push({ start: cursor, end: interval.end });
    }
  }
  return result;
}

export function clip(interval: Interval, from: number, to: number): Interval | undefined {
  const start = Math.max(interval.start, from);
  const end = Math.min(interval.end, to);
  return end > start ? { start, end } : undefined;
}

export function duration(intervals: Interval[]): number {
  return intervals.reduce((sum, { start, end }) => sum + (end - start), 0);
}

export function minutes(ms: number): number {
  return Math.round(ms / MINUTE_MS);
}
