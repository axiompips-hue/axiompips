// electron-installer/installer-preload.js
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installer', {
  checkExisting:   ()           => ipcRenderer.invoke('check-existing'),
  getDefaultPath:  ()           => ipcRenderer.invoke('get-default-path'),
  startInstall:    (path)       => ipcRenderer.invoke('start-install', path),
  startUninstall:  (path)       => ipcRenderer.invoke('start-uninstall', path),
  launchApp:       ()           => ipcRenderer.invoke('launch-app'),
  openWebsite:     ()           => ipcRenderer.invoke('open-website'),
  quit:            ()           => ipcRenderer.invoke('quit'),
  onProgress:      (cb)         => ipcRenderer.on('install-progress', (_, data) => cb(data)),
});
