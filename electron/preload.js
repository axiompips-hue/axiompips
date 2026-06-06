// electron/preload.js
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop:    true,
  getVersion:   () => ipcRenderer.invoke('app-version'),
  getPlatform:  () => ipcRenderer.invoke('platform'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
