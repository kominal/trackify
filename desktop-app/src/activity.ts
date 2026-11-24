import { app, powerMonitor } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActivitySegment, DesktopSettings } from './shared';

const SAMPLE_MS = 5 * 1000;
// A sample arriving later than this after the previous one (sleep, a hung process) starts a new segment.
const MAX_GAP_MS = 3 * SAMPLE_MS;
// Upper bound of what waits on disk while the app is offline (about a week of busy switching).
const MAX_QUEUE = 20000;

interface Sample {
  app: string;
  title: string;
  idle: boolean;
}

interface ActiveWindowResult {
  title: string;
  owner: { name: string; path?: string };
}

type ActiveWindow = () => Promise<ActiveWindowResult | undefined>;

// Records which window is in focus: one sample every few seconds, consecutive equal samples merged
// into segments. Finished segments wait in a queue (persisted to disk) until the web app drains
// and uploads them; this process never talks to the backend itself.
export class ActivityRecorder {
  private queue: ActivitySegment[] = [];
  private current: (ActivitySegment & { lastSample: number }) | undefined;
  private timer: NodeJS.Timeout | undefined;
  private persistTimer: NodeJS.Timeout | undefined;
  private activeWindow: ActiveWindow | undefined;
  private locked = false;

  public constructor(private settings: () => DesktopSettings) {
    this.queue = this.load();
    powerMonitor.on('lock-screen', () => {
      this.locked = true;
      this.close();
    });
    powerMonitor.on('unlock-screen', () => (this.locked = false));
    powerMonitor.on('suspend', () => this.close());
    powerMonitor.on('shutdown', () => this.persist());
  }

  public start(): void {
    this.timer ??= setInterval(() => void this.sample(), SAMPLE_MS);
    this.persistTimer ??= setInterval(() => this.persist(), 60 * 1000);
  }

  public stop(): void {
    clearInterval(this.timer);
    clearInterval(this.persistTimer);
    this.timer = undefined;
    this.persistTimer = undefined;
    this.close();
    this.persist();
  }

  // Hands out everything recorded so far, including the running segment up to now (it continues as a
  // new segment; the backend joins the two again because they are adjacent and equal).
  public drain(): ActivitySegment[] {
    if (this.current && this.current.end > this.current.start) {
      const { lastSample: _, ...segment } = this.current;
      this.queue.push(segment);
      this.current = { ...this.current, start: this.current.end };
    }
    const drained = this.queue;
    this.queue = [];
    this.persist();
    return drained;
  }

  // Puts back what could not be uploaded, ahead of anything recorded in the meantime.
  public restore(segments: unknown): void {
    if (!Array.isArray(segments)) {
      return;
    }
    const valid = segments.filter((segment): segment is ActivitySegment => !!segment && typeof segment.start === 'string' && typeof segment.end === 'string' && typeof segment.app === 'string' && typeof segment.title === 'string' && typeof segment.idle === 'boolean');
    this.queue = [...valid, ...this.queue].slice(-MAX_QUEUE);
    this.persist();
  }

  private async sample(): Promise<void> {
    const settings = this.settings();
    if (!settings.activityTracking || this.locked) {
      this.close();
      return;
    }

    const now = Date.now();
    let sample: Sample;
    if (powerMonitor.getSystemIdleTime() >= settings.idleThresholdSeconds) {
      sample = { app: 'idle', title: '', idle: true };
    } else {
      const window = await this.readActiveWindow();
      if (!window) {
        this.close();
        return;
      }
      const name = window.owner.name || window.owner.path?.split(/[\\/]/).pop() || '?';
      if (settings.excludedApps.some((excluded) => excluded.toLowerCase() === name.toLowerCase())) {
        // Excluded applications leave no trace at all, not even that something was open.
        this.close();
        return;
      }
      sample = { app: name.slice(0, 120), title: (window.title || '').slice(0, 500), idle: false };
    }

    const current = this.current;
    if (current?.app === sample.app && current.title === sample.title && current.idle === sample.idle && now - current.lastSample <= MAX_GAP_MS) {
      current.end = new Date(now).toISOString();
      current.lastSample = now;
      return;
    }
    this.close();
    const start = new Date(now - SAMPLE_MS).toISOString();
    this.current = { ...sample, start, end: new Date(now).toISOString(), lastSample: now };
  }

  private close(): void {
    if (this.current) {
      const { lastSample: _, ...segment } = this.current;
      if (segment.end > segment.start) {
        this.queue.push(segment);
        if (this.queue.length > MAX_QUEUE) {
          this.queue.splice(0, this.queue.length - MAX_QUEUE);
        }
      }
      this.current = undefined;
    }
  }

  private async readActiveWindow(): Promise<ActiveWindowResult | undefined> {
    try {
      // get-windows is an ES module with a native addon; loaded on first use.
      this.activeWindow ??= ((await import('get-windows')) as unknown as { activeWindow: ActiveWindow }).activeWindow;
      return await this.activeWindow();
    } catch {
      return undefined;
    }
  }

  private file(): string {
    return join(app.getPath('userData'), 'activity-queue.json');
  }

  private load(): ActivitySegment[] {
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.file(), 'utf8'));
      return Array.isArray(parsed) ? (parsed as ActivitySegment[]).slice(-MAX_QUEUE) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      writeFileSync(this.file(), JSON.stringify(this.queue));
    } catch {
      // A full disk must not stop the app; the queue stays in memory.
    }
  }
}
