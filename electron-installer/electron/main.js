// electron-installer/electron/main.js
// The AxiomPips desktop app — a native Electron window that loads TARGET_URL.
// This is what users have installed and run daily.
'use strict';

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { APP_NAME, APP_VERSION, TARGET_URL } = require('./config');

let mainWindow   = null;
let splashWindow = null;

// ── Helpers ────────────────────────────────────────────────────────────────────

function isAppUrl(url) {
  return url.startsWith(TARGET_URL) || url.startsWith('http://localhost');
}

function loadErrorPage(win) {
  if (!win || win.isDestroyed()) return;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <title>${APP_NAME} — Connection Error</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0d0e11; color: #e2e2ec;
      display: flex; align-items: center; justify-content: center;
      height: 100vh; text-align: center; user-select: none;
    }
    .card { max-width: 480px; padding: 56px 48px; }
    .icon {
      width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 28px;
      background: linear-gradient(135deg, #0c4a6e, #0e7490 50%, #06b6d4);
      display: flex; align-items: center; justify-content: center;
    }
    .icon svg { width: 34px; height: 34px; stroke: #fff; fill: none;
                stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 12px; }
    p { font-size: 13px; color: #70708a; line-height: 1.7; margin-bottom: 36px; }
    code { font-family: 'Consolas', monospace; background: rgba(255,255,255,0.06);
           padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #94a3b8; }
    .actions { display: flex; flex-direction: column; gap: 10px; align-items: center; }
    button {
      padding: 11px 32px; border: none; border-radius: 10px; cursor: pointer;
      font-size: 13px; font-weight: 600; min-width: 180px;
      transition: opacity 0.2s, transform 0.15s;
    }
    button:active { transform: scale(0.97); }
    .primary {
      background: linear-gradient(135deg, #0c4a6e, #0e7490 50%, #06b6d4); color: #fff;
      box-shadow: 0 4px 18px rgba(6,182,212,0.3);
    }
    .primary:hover { opacity: 0.88; }
    .ghost {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #70708a;
    }
    .ghost:hover { background: rgba(255,255,255,0.08); color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <line x1="12" y1="2" x2="12" y2="6"/><rect x="9" y="6" width="6" height="8" rx="1"/>
        <line x1="12" y1="14" x2="12" y2="18"/>
        <line x1="5" y1="5" x2="5" y2="8"/><rect x="2" y="8" width="6" height="6" rx="1"/>
        <line x1="5" y1="14" x2="5" y2="17"/>
      </svg>
    </div>
    <h1>Could not connect to AxiomPips</h1>
    <p>
      Make sure the application is running at<br/>
      <code>${TARGET_URL}</code><br/><br/>
      If you just launched the app, it may still be starting up.
    </p>
    <div class="actions">
      <button class="primary" onclick="location.reload()">Retry</button>
      <button class="ghost" onclick="window.open('${TARGET_URL}')">Open in Browser</button>
    </div>
  </div>
</body>
</html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// ── Splash window ──────────────────────────────────────────────────────────────

function createSplash() {
  splashWindow = new BrowserWindow({
    width:       440,
    height:      280,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    resizable:   false,
    center:      true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  // Destroy cleanly if something goes wrong
  splashWindow.on('closed', () => { splashWindow = null; });
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// ── Main window ────────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:       1280,
    height:      800,
    minWidth:    960,
    minHeight:   600,
    show:        false,        // hidden until ready-to-show
    title:       APP_NAME,
    icon:        path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration:  false, // SEC: never expose Node.js to renderer
      contextIsolation: true,  // SEC: strict context separation
      sandbox:          true,  // SEC: sandboxed renderer process
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  // ── Navigation security ──────────────────────────────────────────────────
  //
  // Any URL that is NOT the app URL opens in the system browser.
  // This prevents phishing / malicious redirects from running inside Electron.

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppUrl(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // ── Load lifecycle ───────────────────────────────────────────────────────

  mainWindow.once('ready-to-show', () => {
    closeSplash();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode) => {
    // errorCode -3 = ABORTED (navigation cancelled during SPA routing — not a real error)
    if (errorCode === -3) return;
    loadErrorPage(mainWindow);
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Load the app — wrap in try/catch for synchronous errors (e.g. invalid URL)
  try {
    mainWindow.loadURL(TARGET_URL);
  } catch (err) {
    console.error('[main] loadURL failed:', err.message);
    loadErrorPage(mainWindow);
  }
}

// ── App menu ───────────────────────────────────────────────────────────────────

function createMenu() {
  const zoomBy = (delta) => {
    if (!mainWindow) return;
    const next = mainWindow.webContents.getZoomFactor() + delta;
    mainWindow.webContents.setZoomFactor(Math.max(0.5, Math.min(2.0, next)));
  };

  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label:       'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        { type: 'separator' },
        {
          label:       'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label:       'Zoom In',
          accelerator: 'CmdOrCtrl+Equal',
          click: () => zoomBy(+0.1),
        },
        {
          label:       'Zoom Out',
          accelerator: 'CmdOrCtrl+Minus',
          click: () => zoomBy(-0.1),
        },
        {
          label:       'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomFactor(1.0),
        },
        { type: 'separator' },
        {
          label:       'Toggle DevTools',
          accelerator: 'F12',
          visible:     !app.isPackaged, // dev only — hidden in production builds
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          // Disabled — acts as a version label in the menu
          label:   `About ${APP_NAME} v${APP_VERSION}`,
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'Open in Browser',
          click: () => shell.openExternal(TARGET_URL),
        },
      ],
    },
  ]);
}

// ── IPC handlers ───────────────────────────────────────────────────────────────

// Returns the running app version to renderer code.
ipcMain.handle('app-version', () => APP_VERSION);

// Returns the platform string (e.g. 'win32') to renderer code.
ipcMain.handle('platform', () => process.platform);

// Opens a URL in the system browser — validates protocol first.
// SEC: only http: and https: are allowed; anything else is silently dropped.
ipcMain.handle('open-external', (_, url) => {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'https:' || protocol === 'http:') {
      shell.openExternal(url);
    }
  } catch (_err) {
    // Invalid URL — silently ignore
  }
});

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createSplash();
  Menu.setApplicationMenu(createMenu());
  // Short delay so the splash window renders before the heavier main window starts
  setTimeout(createMainWindow, 300);
});

// Quit when all windows are closed (Windows / Linux behaviour — also fine on macOS
// for this app since it is Windows-only).
app.on('window-all-closed', () => app.quit());

// Re-create the window if the dock icon is clicked (macOS convention).
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// ── Global error guard ─────────────────────────────────────────────────────────
// Log uncaught exceptions rather than crashing the process silently.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
