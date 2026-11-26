import { Interval, MINUTE_MS } from '@helpers/interval.helper';

// Leaving an app for less than this and coming back does not end its block on the timeline.
export const DETOUR_MAX_MINUTES = 5;
// Segments further apart than this were not recorded in between (lock, suspend, excluded app): a real break.
export const BLOCK_JOIN_GAP_MS = MINUTE_MS;

export interface ActivitySegmentInterval extends Interval {
  app: string;
  title: string;
  idle: boolean;
}

export interface ActivityDetour {
  app: string;
  seconds: number;
}

export interface ActivityBlock extends ActivitySegmentInterval {
  // Other apps used for a moment inside this block, longest first.
  detours: ActivityDetour[];
}

interface Run extends Interval {
  app: string;
  idle: boolean;
  titles: Map<string, number>;
}

interface OpenBlock extends Run {
  detours: Map<string, number>;
}

function add(target: Map<string, number>, key: string, ms: number): void {
  target.set(key, (target.get(key) ?? 0) + ms);
}

function longest(values: Map<string, number>): [string, number][] {
  return [...values].sort((a, b) => b[1] - a[1]);
}

// Consecutive segments of one app, whatever the window title: a tab or file change is not a new activity.
function toRuns(segments: ActivitySegmentInterval[]): Run[] {
  const runs: Run[] = [];
  for (const segment of [...segments].sort((a, b) => a.start - b.start)) {
    if (segment.end <= segment.start) {
      continue;
    }
    const last = runs[runs.length - 1];
    if (last?.app === segment.app && last.idle === segment.idle && segment.start - last.end <= BLOCK_JOIN_GAP_MS) {
      add(last.titles, segment.title, segment.end - segment.start);
      last.end = Math.max(last.end, segment.end);
    } else {
      runs.push({ app: segment.app, idle: segment.idle, start: segment.start, end: segment.end, titles: new Map([[segment.title, segment.end - segment.start]]) });
    }
  }
  return runs;
}

// What the timeline shows as PC activity: one block per stretch of work in an app. A short look at
// something else (less than DETOUR_MAX_MINUTES away, then back in the same app) stays inside the
// block and is listed as a detour. Idle time and unrecorded stretches always end a block.
export function activityBlocks(segments: ActivitySegmentInterval[]): ActivityBlock[] {
  const todo = toRuns(segments).reverse();
  const blocks: ActivityBlock[] = [];
  let main: OpenBlock | undefined;
  let pending: Run[] = [];

  // The main block ends where the user left it; what came after is looked at again as a fresh start.
  const close = (next?: Run): void => {
    if (main) {
      blocks.push({
        app: main.app,
        title: longest(main.titles)[0]?.[0] ?? '',
        idle: main.idle,
        start: main.start,
        end: main.end,
        detours: longest(main.detours).map(([app, ms]) => ({ app, seconds: Math.round(ms / 1000) })),
      });
      main = undefined;
    }
    if (next) {
      todo.push(next);
    }
    todo.push(...pending.reverse());
    pending = [];
  };

  while (todo.length > 0 || main) {
    const run = todo.pop();
    if (!run) {
      close();
    } else if (!main) {
      main = { ...run, titles: new Map(run.titles), detours: new Map() };
    } else if (main.idle || run.idle || run.start - (pending[pending.length - 1] ?? main).end > BLOCK_JOIN_GAP_MS) {
      close(run);
    } else if (run.app === main.app && run.start - main.end < DETOUR_MAX_MINUTES * MINUTE_MS) {
      for (const detour of pending) {
        add(main.detours, detour.app, detour.end - detour.start);
      }
      for (const [title, ms] of run.titles) {
        add(main.titles, title, ms);
      }
      main.end = run.end;
      pending = [];
    } else {
      pending.push(run);
      if (run.end - main.end >= DETOUR_MAX_MINUTES * MINUTE_MS) {
        close();
      }
    }
  }
  return blocks;
}
