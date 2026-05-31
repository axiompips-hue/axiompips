// electron/main.js
// AxiomPips Desktop App - Main Electron Process
// ICO file path: electron/assets/icon.ico  <-- place your icon here

'use strict';

const { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ─── Constants ──────────────────────────────────────────────────────────────
const APP_NAME        = 'AxiomPips';
const APP_URL_DEV     = 'http://localhost:3000';
const APP_URL_PROD    = 'https://axiompips.com';      // fallback if no local server
const ICON_PATH       = path.join(__dirname, 'assets', 'icon.ico'); // <── your ICO here
const PRELOAD_PATH    = path.join(__dirname, 'preload.js');

const isDev  = !app.isPackaged;
const isMac  = process.platform === 'darwin';
const isWin  = process.platform === 'win32';

// ─── Window reference (prevent GC) ──────────────────────────────────────────
let mainWindow = null;
let tray       = null;
let isQuitting = false;

// ─── Single Instance Lock ────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Create Main Window ──────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        800,
    minHeight:       600,
    title:           APP_NAME,
    icon:            ICON_PATH,
    backgroundColor: '#0d0e11',        // matches --color-bg-primary
    titleBarStyle:   isWin ? 'default' : 'hiddenInset',
    frame:           true,
    show:            false,            // shown after ready-to-show
    webPreferences: {
      preload:            PRELOAD_PATH,
      contextIsolation:   true,
      nodeIntegration:    false,
      sandbox:            true,
      webSecurity:        true,
      allowRunningInsecureContent: false,
    },
  });

  // ── Load the Next.js app ─────────────────────────────────────────────────
  const url = isDev ? APP_URL_DEV : APP_URL_PROD;
  mainWindow.loadURL(url).catch(() => {
    // If local dev server isn't running, load prod
    mainWindow.loadURL(APP_URL_PROD);
  });

  // ── Show when ready (prevents white flash) ───────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // ── Open external links in system browser ───────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    const parsed = new URL(targetUrl);
    const appHost = new URL(isDev ? APP_URL_DEV : APP_URL_PROD).host;
    if (parsed.host !== appHost) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // ── Intercept navigation to external domains ─────────────────────────────
  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    const parsed = new URL(navUrl);
    const appHost = new URL(isDev ? APP_URL_DEV : APP_URL_PROD).host;
    if (parsed.host !== appHost) {
      event.preventDefault();
      shell.openExternal(navUrl);
    }
  });

  // ── Minimize to tray on close (Windows) ─────────────────────────────────
  mainWindow.on('close', (event) => {
    if (!isQuitting && isWin) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  buildAppMenu();
}

// ─── Application Menu ────────────────────────────────────────────────────────
function buildAppMenu() {
  const template = [
    ...(isMac ? [{
      label: APP_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow(),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Home',              click: () => navigate('/') },
        { label: 'Calculators',       click: () => navigate('/calculators') },
        { label: 'Position Size',     click: () => navigate('/calculators/position-size') },
        { label: 'Pip Value',         click: () => navigate('/calculators/pip-value') },
        { label: 'Margin',            click: () => navigate('/calculators/margin') },
        { label: 'Risk/Reward',       click: () => navigate('/calculators/risk-reward') },
        { label: 'Profit/Loss',       click: () => navigate('/calculators/profit-loss') },
        { label: 'Fibonacci',         click: () => navigate('/calculators/fibonacci') },
        { label: 'DCA',               click: () => navigate('/calculators/dca') },
        { label: 'ATR',               click: () => navigate('/calculators/atr') },
        { label: 'Spread Cost',       click: () => navigate('/calculators/spread-cost') },
        { label: 'Pivot Points',      click: () => navigate('/calculators/pivot-points') },
        { label: 'Swap',              click: () => navigate('/calculators/swap') },
        { label: 'Break Even',        click: () => navigate('/calculators/break-even') },
        { type: 'separator' },
        { label: 'Trade Journal',     click: () => navigate('/journal') },
        { label: 'Dashboard',         click: () => navigate('/dashboard') },
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
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open in Browser',
          click: () => shell.openExternal(APP_URL_PROD),
        },
        {
          label: 'About AxiomPips',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type:    'info',
              title:   'About AxiomPips',
              message: 'AxiomPips Desktop',
              detail:  `Version: ${app.getVersion()}\nPrecision Forex Calculators & Trading Tools\n\nhttps://axiompips.com`,
              icon:    ICON_PATH,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── System Tray (Windows & Linux) ───────────────────────────────────────────
function createTray() {
  if (isMac) return; // macOS handles this via dock

  try {
    const trayIcon = nativeImage.createFromPath(ICON_PATH);
    tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon);
    tray.setToolTip('AxiomPips - Forex Calculators');

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open AxiomPips',  click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { type: 'separator' },
      { label: 'Position Size',   click: () => { mainWindow?.show(); navigate('/calculators/position-size'); } },
      { label: 'Pip Value',       click: () => { mainWindow?.show(); navigate('/calculators/pip-value'); } },
      { label: 'Risk/Reward',     click: () => { mainWindow?.show(); navigate('/calculators/risk-reward'); } },
      { type: 'separator' },
      {
        label: 'Quit', click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
  } catch (_err) {
    // Icon not found yet — tray skipped silently
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
function registerIPC() {
  // Let renderer know it's running inside Electron
  ipcMain.handle('is-desktop', () => true);
  ipcMain.handle('app-version', () => app.getVersion());
  ipcMain.handle('platform', () => process.platform);

  // Open external link safely
  ipcMain.handle('open-external', (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  });
}

// ─── Helper: navigate renderer to a path ────────────────────────────────────
function navigate(routePath) {
  if (!mainWindow) return;
  const base = isDev ? APP_URL_DEV : APP_URL_PROD;
  mainWindow.loadURL(`${base}${routePath}`);
  mainWindow.show();
  mainWindow.focus();
}

// ─── Auto-updater (production only) ─────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type:    'info',
      title:   'Update Available',
      message: 'A new version of AxiomPips is available.',
      detail:  'It will be downloaded in the background and installed on restart.',
      buttons: ['OK'],
    });
  });
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  registerIPC();
  createWindow();
  createTray();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('before-quit', () => { isQuitting = true; });

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
