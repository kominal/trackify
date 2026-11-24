import { app } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DesktopSettings } from './shared';

const DEFAULTS: DesktopSettings = {
  autostart: true,
  startHidden: true,
  activityTracking: true,
  idleThresholdSeconds: 300,
  excludedApps: [],
};

const file = (): string => join(app.getPath('userData'), 'settings.json');

export function loadSettings(): DesktopSettings {
  try {
    return sanitize({ ...DEFAULTS, ...(JSON.parse(readFileSync(file(), 'utf8')) as Partial<DesktopSettings>) });
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: DesktopSettings): DesktopSettings {
  const clean = sanitize(settings);
  writeFileSync(file(), JSON.stringify(clean, null, 2));
  return clean;
}

// The renderer is a web page: never trust the shape of what it sends.
export function sanitize(value: Partial<DesktopSettings>): DesktopSettings {
  const threshold = Number(value.idleThresholdSeconds);
  return {
    autostart: value.autostart === true,
    startHidden: value.startHidden !== false,
    activityTracking: value.activityTracking !== false,
    idleThresholdSeconds: Number.isFinite(threshold) ? Math.min(3600, Math.max(60, Math.round(threshold))) : DEFAULTS.idleThresholdSeconds,
    excludedApps: Array.isArray(value.excludedApps)
      ? value.excludedApps
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim().slice(0, 120))
          .filter(Boolean)
          .slice(0, 50)
      : [],
  };
}
