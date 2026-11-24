// Types shared by the main process and the preload script. The web app has its own copy of the
// bridge's shape (frontend-app/src/app/models/native.model.ts); keep both in step.

export interface DesktopSettings {
  autostart: boolean;
  startHidden: boolean;
  activityTracking: boolean;
  idleThresholdSeconds: number;
  excludedApps: string[];
}

export interface ActivitySegment {
  start: string;
  end: string;
  app: string;
  title: string;
  idle: boolean;
}

export interface NotificationRequest {
  title: string;
  body: string;
  tag: string;
}

export interface TrackingState {
  taskName?: string;
  projectName?: string;
  since?: string;
}

export type Shortcut = 'previous-task' | 'next-task';

export const CHANNELS = {
  getSettings: 'trackify:get-settings',
  setSettings: 'trackify:set-settings',
  idleSeconds: 'trackify:idle-seconds',
  drainActivity: 'trackify:drain-activity',
  restoreActivity: 'trackify:restore-activity',
  notify: 'trackify:notify',
  notificationClick: 'trackify:notification-click',
  shortcut: 'trackify:shortcut',
  setTrackingState: 'trackify:set-tracking-state',
  trayStop: 'trackify:tray-stop',
} as const;

// Passed to the preload script as a command line switch, so it can expose the bridge to the app's own origin only.
export const ORIGIN_ARGUMENT = '--trackify-origin=';
export const VERSION_ARGUMENT = '--trackify-version=';
