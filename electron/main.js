// electron/main.js — AxiomPips Desktop
// ICO path: electron/assets/icon.ico

'use strict';

const { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain, dialog } = require('electron');
const path = require('path');

const APP_NAME    = 'AxiomPips';
const APP_URL     = 'https://axiompips.com';
const ICON_PATH   = path.join(__dirname, 'assets', 'icon.ico');
const PRELOAD     = path.join(__dirname, 'preload.js');
const SPLASH      = path.join(__dirname, 'splash.html');

const isDev  = !app.isPackaged;
const isMac  = process.platform === 'darwin';
const isWin  = process.platform === 'win32';

let mainWindow  = null;
let splashWindow = null;
let tray        = null;
let isQuitting  = false;

// ── Single instance ──────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Splash window ─────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width:           440,
    height:          280,
    frame:           false,
    transparent:     true,
    resizable:       false,
    alwaysOnTop:     true,
    skipTaskbar:     true,
    icon:            ICON_PATH,
    webPreferences:  { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(SPLASH);
  splashWindow.center();
}

// ── Main window ───────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1320,
    height:          860,
    minWidth:        900,
    minHeight:       620,
    title:           APP_NAME,
    icon:            ICON_PATH,
    backgroundColor: '#0d0e11',
    titleBarStyle:   isWin ? 'hidden' : 'hiddenInset',
    titleBarOverlay: isWin ? {
      color:        '#0d0e11',
      symbolColor:  '#06b6d4',
      height:       40,
    } : false,
    frame:           !isWin,
    show:            false,
    webPreferences: {
      preload:          PRELOAD,
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
      mainWindow.show();
    }, 2200);
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const u = new URL(url);
    if (u.host !== new URL(APP_URL).host) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      if (u.host !== new URL(APP_URL).host) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch (_) {}
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting && isWin) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  buildMenu();
}

// ── App menu ──────────────────────────────────────────────────────────────────
function buildMenu() {
  const nav = (p) => { mainWindow?.loadURL(`${APP_URL}${p}`); mainWindow?.show(); };
  const template = [
    ...(isMac ? [{ label: APP_NAME, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }] : []),
    { label: 'File', submenu: [isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' }] },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Home',           click: () => nav('/') },
        { label: 'Calculators',    click: () => nav('/calculators') },
        { label: 'Tools',          click: () => nav('/tools') },
        { label: 'Journal',        click: () => nav('/journal') },
        { label: 'Dashboard',      click: () => nav('/dashboard') },
        { label: 'Settings',       click: () => nav('/settings') },
        { type: 'separator' },
        { label: 'Position Size',  click: () => nav('/calculators/position-size') },
        { label: 'Pip Value',      click: () => nav('/calculators/pip-value') },
        { label: 'Margin',         click: () => nav('/calculators/margin') },
        { label: 'Risk/Reward',    click: () => nav('/calculators/risk-reward') },
        { label: 'Fibonacci',      click: () => nav('/calculators/fibonacci') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    {
      label: 'Help',
      submenu: [
        { label: 'Open in Browser', click: () => shell.openExternal(APP_URL) },
        { label: `About ${APP_NAME}`, click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: `About ${APP_NAME}`, message: `${APP_NAME} Desktop`, detail: `Version: ${app.getVersion()}\nPrecision Forex Calculators & Trading Tools\n\n${APP_URL}`, buttons: ['OK'] }) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── System tray ───────────────────────────────────────────────────────────────
function createTray() {
  if (isMac) return;
  try {
    const img = nativeImage.createFromPath(ICON_PATH);
    tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
    tray.setToolTip('AxiomPips — Precision Forex Tools');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open AxiomPips', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { type: 'separator' },
      { label: 'Position Size',  click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/calculators/position-size`); } },
      { label: 'Pip Value',      click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/calculators/pip-value`); } },
      { label: 'Risk/Reward',    click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/calculators/risk-reward`); } },
      { type: 'separator' },
      { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
    ]));
    tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
  } catch (_) {}
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('is-desktop',    () => true);
ipcMain.handle('app-version',   () => app.getVersion());
ipcMain.handle('platform',      () => process.platform);
ipcMain.handle('open-external', (_, url) => {
  if (typeof url === 'string' && url.startsWith('https://')) shell.openExternal(url);
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createSplash();
  createWindow();
  createTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
