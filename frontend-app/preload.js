const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTrackingPrevious: (callback) => ipcRenderer.on('tracking-previous', (_event, value) => callback(value)),
  onTrackingNext: (callback) => ipcRenderer.on('tracking-next', (_event, value) => callback(value)),
});
