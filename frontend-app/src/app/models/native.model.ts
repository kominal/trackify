// The bridge the Trackify desktop app (desktop-app/src/preload.ts) exposes as window.trackifyNative.
// Absent in a normal browser; NativeService wraps it so the web app works without it.

export interface DesktopSettings {
  autostart: boolean;
  startHidden: boolean;
  activityTracking: boolean;
  // Seconds without keyboard or mouse input after which the user counts as away.
  idleThresholdSeconds: number;
  // Process names that are never recorded (e.g. a password manager).
  excludedApps: string[];
}

export interface NativeActivitySegment {
  start: string;
  end: string;
  app: string;
  title: string;
  idle: boolean;
}

export interface NativeNotification {
  title: string;
  body: string;
  // Sent back through onNotificationClick when the notification is clicked.
  tag: string;
}

export type NativeShortcut = 'previous-task' | 'next-task';

export interface TrackifyNative {
  version: string;
  getSettings(): Promise<DesktopSettings>;
  setSettings(settings: DesktopSettings): Promise<DesktopSettings>;
  idleSeconds(): Promise<number>;
  // Removes and returns the recorded segments; give them back with restoreActivity if the upload fails.
  drainActivity(): Promise<NativeActivitySegment[]>;
  restoreActivity(segments: NativeActivitySegment[]): Promise<void>;
  notify(notification: NativeNotification): Promise<void>;
  onNotificationClick(listener: (tag: string) => void): () => void;
  onShortcut(listener: (shortcut: NativeShortcut) => void): () => void;
  // Tells the tray which task runs (undefined: nothing).
  setTrackingState(state: { taskName?: string; projectName?: string; since?: string }): void;
  onTrayStop(listener: () => void): () => void;
}

declare global {
  interface Window {
    trackifyNative?: TrackifyNative;
  }
}
