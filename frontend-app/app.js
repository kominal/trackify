// app.js

const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');
const { globalShortcut } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true,
      autoHideMenuBar: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.session.webRequest.onBeforeRequest({ urls: ['http://localhost/callback*'] }, (request) => {
    url.format({
      pathname: path.join(__dirname, `/dist/browser/index.html`),
      protocol: 'file:',
      slashes: true,
    });

    console.log(request.url);

    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);

    return mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, `/dist/browser/index.html`),
        protocol: 'file:',
        slashes: true,
        query: {
          code: urlSearchParams.get('code'),
          state: urlSearchParams.get('state'),
        },
      }),
    );
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/browser/index.html`),
      protocol: 'file:',
      slashes: true,
    }),
  );

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

app.whenReady().then(() => {
  globalShortcut.register('CmdOrCtrl+Alt+Up', () => mainWindow.webContents.send('tracking-previous'));
  globalShortcut.register('CmdOrCtrl+Alt+Down', () => mainWindow.webContents.send('tracking-next'));
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
