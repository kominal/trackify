import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CHANNELS, DesktopSettings, NotificationRequest, ORIGIN_ARGUMENT, Shortcut, TrackingState, VERSION_ARGUMENT } from './shared';

// The bridge exists for the app's own origin only, never for the login page or anything else.
const argument = (prefix: string): string | undefined => process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
const origin = argument(ORIGIN_ARGUMENT);

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const wrapped = (_event: IpcRendererEvent, value: T): void => listener(value);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

if (origin && window.location.origin === origin) {
  contextBridge.exposeInMainWorld('trackifyNative', {
    version: argument(VERSION_ARGUMENT) ?? '',
    getSettings: (): Promise<DesktopSettings> => ipcRenderer.invoke(CHANNELS.getSettings),
    setSettings: (settings: DesktopSettings): Promise<DesktopSettings> => ipcRenderer.invoke(CHANNELS.setSettings, settings),
    idleSeconds: (): Promise<number> => ipcRenderer.invoke(CHANNELS.idleSeconds),
    drainActivity: () => ipcRenderer.invoke(CHANNELS.drainActivity),
    restoreActivity: (segments: unknown) => ipcRenderer.invoke(CHANNELS.restoreActivity, segments),
    notify: (notification: NotificationRequest): Promise<void> => ipcRenderer.invoke(CHANNELS.notify, notification),
    onNotificationClick: (listener: (tag: string) => void) => subscribe(CHANNELS.notificationClick, listener),
    onShortcut: (listener: (shortcut: Shortcut) => void) => subscribe(CHANNELS.shortcut, listener),
    setTrackingState: (state: TrackingState): void => ipcRenderer.send(CHANNELS.setTrackingState, state),
    onTrayStop: (listener: () => void) => subscribe(CHANNELS.trayStop, listener),
  });
}
