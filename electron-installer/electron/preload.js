// electron-installer/electron/preload.js
// Exposes a safe, minimal API to the AxiomPips renderer via contextBridge.
// nodeIntegration is false in the main window — this bridge is the only way
// renderer code can reach main-process capabilities.
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop:    true,
  getVersion:   ()    => ipcRenderer.invoke('app-version'),
  getPlatform:  ()    => ipcRenderer.invoke('platform'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
