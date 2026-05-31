// electron/preload.js
// Secure context bridge — exposes only what the renderer needs

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** True when running inside the desktop app */
  isDesktop: true,

  /** Returns the app version string */
  getVersion: () => ipcRenderer.invoke('app-version'),

  /** Returns win32 | darwin | linux */
  getPlatform: () => ipcRenderer.invoke('platform'),

  /** Safely opens a URL in the system browser */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
