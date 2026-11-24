import { app, BrowserWindow, globalShortcut, ipcMain, IpcMainEvent, IpcMainInvokeEvent, Menu, nativeImage, Notification, powerMonitor, shell, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'node:path';
import { ActivityRecorder } from './activity';
import { loadSettings, sanitize, saveSettings } from './settings';
import { CHANNELS, DesktopSettings, NotificationRequest, ORIGIN_ARGUMENT, Shortcut, TrackingState, VERSION_ARGUMENT } from './shared';

// The desktop app is a frame around the hosted web app: login, UI and its updates come from the
// normal deployment. TRACKIFY_URL points it at another instance (e.g. http://localhost:4200).
const APP_URL = new URL(process.env.TRACKIFY_URL || 'https://trackify.kominal.cloud');
const APP_ORIGIN = APP_URL.origin;
// Origins the window may navigate to besides the app: the Keycloak login.
const AUTH_ORIGINS = (process.env.TRACKIFY_AUTH_ORIGINS || 'https://auth.kominal.com').split(',').map((origin) => origin.trim());
const RETRY_MS = 30 * 1000;
const UPDATE_CHECK_MS = 6 * 60 * 60 * 1000;
const german = (): boolean => app.getLocale().toLowerCase().startsWith('de');
const t = (de: string, en: string): string => (german() ? de : en);

let window: BrowserWindow | undefined;
let tray: Tray | undefined;
let quitting = false;
let settings: DesktopSettings;
let trackingState: TrackingState = {};
let retryTimer: NodeJS.Timeout | undefined;
const recorder = new ActivityRecorder(() => settings);
const iconPath = join(__dirname, '..', 'static', 'icon.png');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.setAppUserModelId('com.kominal.trackify');
  void app.whenReady().then(start);
}

function start(): void {
  settings = loadSettings();
  applyAutostart();
  createTray();
  registerIpc();
  registerShortcuts();

  const launchedAtLogin = process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAtLogin;
  createWindow(!(launchedAtLogin && settings.startHidden));

  recorder.start();

  if (app.isPackaged) {
    void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
    setInterval(() => void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined), UPDATE_CHECK_MS);
  }

  // Back from sleep: the page may hold an expired session and stale data.
  powerMonitor.on('resume', () => window?.webContents.reload());
}

function createWindow(show: boolean): void {
  window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 520,
    show,
    icon: iconPath,
    title: 'Trackify',
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      // Timers (reminders, the activity upload) must keep running while the window is hidden.
      backgroundThrottling: false,
      preload: join(__dirname, 'preload.js'),
      additionalArguments: [`${ORIGIN_ARGUMENT}${APP_ORIGIN}`, `${VERSION_ARGUMENT}${app.getVersion()}`],
    },
  });

  const contents = window.webContents;

  // Only the app and its login run inside the window; every other link opens in the browser.
  contents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
      openExternal(url);
    }
  });
  contents.on('will-redirect', (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
    }
  });

  // Offline at start (or the server is down): a local page that retries on its own.
  contents.on('did-fail-load', (_event, errorCode, _description, url, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 /* aborted, e.g. by a redirect */ || url.startsWith('file:')) {
      return;
    }
    void window?.loadFile(join(__dirname, '..', 'static', 'offline.html'), { query: { de: german() ? '1' : '0', url: APP_URL.toString() } });
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void window?.loadURL(APP_URL.toString()), RETRY_MS);
  });

  // Closing hides the window: tracking, reminders and the activity recording go on in the tray.
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      window?.hide();
    }
  });

  void window.loadURL(APP_URL.toString());
}

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin === APP_ORIGIN || AUTH_ORIGINS.includes(parsed.origin) || parsed.protocol === 'file:';
  } catch {
    return false;
  }
}

function openExternal(url: string): void {
  if (/^https?:\/\//i.test(url)) {
    void shell.openExternal(url);
  }
}

function showWindow(): void {
  if (!window || window.isDestroyed()) {
    createWindow(true);
    return;
  }
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }));
  tray.on('click', () => showWindow());
  updateTray();
}

function updateTray(): void {
  if (!tray) {
    return;
  }
  const running = trackingState.taskName;
  const since = trackingState.since ? new Date(trackingState.since).toLocaleTimeString(german() ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  tray.setToolTip(running ? `Trackify – ${running}${trackingState.projectName ? ` (${trackingState.projectName})` : ''}` : `Trackify – ${t('nichts läuft', 'nothing running')}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: running ? `${running} · ${t('seit', 'since')} ${since}` : t('Nichts läuft', 'Nothing running'), enabled: false },
      { label: t('Stoppen', 'Stop'), enabled: !!running, click: () => window?.webContents.send(CHANNELS.trayStop) },
      { type: 'separator' },
      { label: t('Trackify öffnen', 'Open Trackify'), click: () => showWindow() },
      { label: t('Mit Windows starten', 'Start with Windows'), type: 'checkbox', checked: settings.autostart, click: (item) => updateSettings({ ...settings, autostart: item.checked }) },
      { label: t('Fensteraktivität aufzeichnen', 'Record window activity'), type: 'checkbox', checked: settings.activityTracking, click: (item) => updateSettings({ ...settings, activityTracking: item.checked }) },
      { type: 'separator' },
      {
        label: t('Beenden', 'Quit'),
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function updateSettings(next: DesktopSettings): DesktopSettings {
  settings = saveSettings(next);
  applyAutostart();
  updateTray();
  return settings;
}

function applyAutostart(): void {
  // Only for the installed app: a development run must not register electron.exe at login.
  if (!app.isPackaged) {
    return;
  }
  app.setLoginItemSettings({ openAtLogin: settings.autostart, args: ['--hidden'] });
}

function registerShortcuts(): void {
  const send = (shortcut: Shortcut) => () => window?.webContents.send(CHANNELS.shortcut, shortcut);
  globalShortcut.register('CommandOrControl+Alt+Up', send('previous-task'));
  globalShortcut.register('CommandOrControl+Alt+Down', send('next-task'));
}

// Every message must come from the app itself (not from the login page or anything else loaded).
function fromApp(event: IpcMainInvokeEvent | IpcMainEvent): boolean {
  const url = event.senderFrame?.url;
  return !!url && new URL(url).origin === APP_ORIGIN;
}

function registerIpc(): void {
  const handle = (channel: string, handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown): void => {
    ipcMain.handle(channel, (event, ...args) => {
      if (!fromApp(event)) {
        throw new Error('Not allowed');
      }
      return handler(event, ...args);
    });
  };

  handle(CHANNELS.getSettings, () => settings);
  handle(CHANNELS.setSettings, (_event, value) => updateSettings(sanitize(typeof value === 'object' && value !== null ? value : {})));
  handle(CHANNELS.idleSeconds, () => powerMonitor.getSystemIdleTime());
  handle(CHANNELS.drainActivity, () => recorder.drain());
  handle(CHANNELS.restoreActivity, (_event, segments) => recorder.restore(segments));
  handle(CHANNELS.notify, (_event, value) => notify(value));

  ipcMain.on(CHANNELS.setTrackingState, (event, value: TrackingState) => {
    if (!fromApp(event) || typeof value !== 'object' || value === null) {
      return;
    }
    trackingState = {
      taskName: typeof value.taskName === 'string' ? value.taskName.slice(0, 120) : undefined,
      projectName: typeof value.projectName === 'string' ? value.projectName.slice(0, 120) : undefined,
      since: typeof value.since === 'string' ? value.since : undefined,
    };
    updateTray();
  });
}

// The renderer is a web page: the request is checked field by field.
function notify(value: unknown): void {
  const request = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof NotificationRequest, unknown>>;
  if (!Notification.isSupported() || typeof request.title !== 'string') {
    return;
  }
  const body = typeof request.body === 'string' ? request.body : '';
  const tag = typeof request.tag === 'string' ? request.tag : '';
  const notification = new Notification({ title: request.title.slice(0, 200), body: body.slice(0, 500), icon: iconPath, silent: tag === 'switched' });
  notification.on('click', () => {
    showWindow();
    window?.webContents.send(CHANNELS.notificationClick, tag);
  });
  notification.show();
}

app.on('before-quit', () => {
  quitting = true;
  recorder.stop();
});

app.on('will-quit', () => globalShortcut.unregisterAll());

// The tray keeps the app alive with all windows hidden.
app.on('window-all-closed', () => undefined);
