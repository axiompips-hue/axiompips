// electron-installer/electron/main.js
'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { APP_NAME, APP_VERSION, TARGET_URL } = require('./config');

let mainWindow   = null;
let splashWindow = null;

// ── Helpers ────────────────────────────────────────────────────────────────────

function isAppUrl(url) {
  return url.startsWith(TARGET_URL) || url.startsWith('http://localhost');
}

// Error page — shown when TARGET_URL fails to load.
// Retry calls window.electronAPI.reloadApp() which triggers the 'reload-app'
// IPC handler, loading TARGET_URL again (not just reloading the data: URL).
function loadErrorPage(win) {
  if (!win || win.isDestroyed()) return;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
  <title>${APP_NAME}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      font-family:'Segoe UI',system-ui,sans-serif;
      background:#09090b;color:#e4e4e7;
      display:flex;align-items:center;justify-content:center;
      height:100vh;text-align:center;
    }
    .card{max-width:420px;padding:48px 40px}
    .icon{
      width:64px;height:64px;border-radius:18px;margin:0 auto 24px;
      background:linear-gradient(135deg,#0c4a6e,#0e7490 50%,#06b6d4);
      display:flex;align-items:center;justify-content:center;
    }
    .icon svg{width:30px;height:30px;stroke:#fff;fill:none;stroke-width:1.6;stroke-linecap:round}
    h1{font-size:19px;font-weight:700;letter-spacing:-.3px;margin-bottom:10px}
    p{font-size:12px;color:#71717a;line-height:1.7;margin-bottom:8px}
    code{font-family:Consolas,monospace;background:rgba(255,255,255,.05);
         padding:2px 7px;border-radius:4px;font-size:11px;color:#94a3b8}
    .note{font-size:11px;color:#52525b;margin-bottom:32px}
    .actions{display:flex;flex-direction:column;gap:8px;align-items:center}
    button{
      padding:10px 28px;border:none;border-radius:8px;cursor:pointer;
      font-size:12px;font-weight:600;min-width:160px;
      transition:opacity .2s,transform .15s;
    }
    button:active{transform:scale(.97)}
    .primary{
      background:linear-gradient(135deg,#0c4a6e,#0e7490 50%,#06b6d4);
      color:#fff;box-shadow:0 4px 16px rgba(6,182,212,.3);
    }
    .primary:hover{opacity:.85}
    .ghost{
      background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.08);color:#71717a;
    }
    .ghost:hover{background:rgba(255,255,255,.08);color:#a1a1aa}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h1>Could not connect</h1>
    <p>AxiomPips is unable to reach<br/><code>${TARGET_URL}</code></p>
    <p class="note">Make sure the app server is running, then retry.</p>
    <div class="actions">
      <button class="primary" onclick="window.electronAPI?.reloadApp()">Retry</button>
      <button class="ghost"   onclick="window.electronAPI?.openInBrowser()">Open in Browser</button>
    </div>
  </div>
</body>
</html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// ── Splash ─────────────────────────────────────────────────────────────────────

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 440, height: 280,
    frame: false, transparent: true,
    alwaysOnTop: true, resizable: false,
    center: true, skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
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
    width: 1280, height: 800,
    minWidth: 960, minHeight: 600,
    show: false,
    title: APP_NAME,
    // frame: false removes the OS title bar and native window controls.
    // We render our own title bar inside the page via the preload script.
    // Windows 11 DWM automatically applies native rounded corners to frameless
    // windows — the same technique used by VS Code.
    frame: false,
    backgroundColor: '#09090b',    // dark bg prevents white flash on load
    webPreferences: {
      nodeIntegration:  false,     // SEC: never expose Node.js to renderer
      contextIsolation: true,      // SEC: strict context isolation
      sandbox:          true,      // SEC: sandboxed renderer
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  // ── Show / splash teardown ───────────────────────────────────────────────

  mainWindow.once('ready-to-show', () => {
    closeSplash();
    mainWindow.show();
    mainWindow.focus();
  });

  // Fallback: if ready-to-show never fires (e.g. TARGET_URL unreachable and
  // loadErrorPage hasn't triggered ready-to-show yet), force-show after 3s.
  setTimeout(() => {
    closeSplash();
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);

  // ── Navigation security ──────────────────────────────────────────────────

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppUrl(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) { event.preventDefault(); shell.openExternal(url); }
  });

  // ── Load failure → error page ────────────────────────────────────────────

  mainWindow.webContents.on('did-fail-load', (_, errorCode) => {
    if (errorCode === -3) return; // -3 = navigation aborted (SPA routing)
    loadErrorPage(mainWindow);
  });

  // ── Maximize state → notify title bar in renderer ───────────────────────

  mainWindow.on('maximize',   () => mainWindow.webContents.send('window-state', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state', false));

  mainWindow.on('closed', () => { mainWindow = null; });

  // ── Load ─────────────────────────────────────────────────────────────────

  try {
    mainWindow.loadURL(TARGET_URL);
  } catch (err) {
    console.error('[main] loadURL failed:', err.message);
    loadErrorPage(mainWindow);
  }
}

// ── IPC handlers ───────────────────────────────────────────────────────────────

ipcMain.handle('app-version',     () => APP_VERSION);
ipcMain.handle('platform',        () => process.platform);
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window-close',        () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// Reload TARGET_URL (not the current data: error page — a real reload).
ipcMain.handle('reload-app', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.loadURL(TARGET_URL).catch(() => loadErrorPage(mainWindow));
});

// Always opens TARGET_URL in the system browser regardless of what page is
// currently loaded in the window (e.g. error page, data: URL, etc.).
ipcMain.handle('open-in-browser', () => shell.openExternal(TARGET_URL));

// SEC: only http/https URLs allowed.
ipcMain.handle('open-external', (_, url) => {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'https:' || protocol === 'http:') shell.openExternal(url);
  } catch (_) {}
});

// Zoom — delta=0 resets to 100%, otherwise adds to current factor.
ipcMain.handle('zoom', (_, delta) => {
  if (!mainWindow) return;
  if (delta === 0) { mainWindow.webContents.setZoomFactor(1.0); return; }
  const next = mainWindow.webContents.getZoomFactor() + delta;
  mainWindow.webContents.setZoomFactor(Math.max(0.5, Math.min(2.0, next)));
});

ipcMain.handle('toggle-devtools', () => mainWindow?.webContents.toggleDevTools());

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // No native menu — custom title bar rendered via preload
  createSplash();
  setTimeout(createMainWindow, 300);
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
