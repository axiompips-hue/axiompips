// electron-installer/electron/main.js
'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http  = require('http');
const https = require('https');
const path  = require('path');
const { APP_NAME, APP_VERSION, TARGET_URL } = require('./config');

let mainWindow   = null;
let splashWindow = null;

// ── Helpers ────────────────────────────────────────────────────────────────────

function isAppUrl(url) {
  return url.startsWith(TARGET_URL) || url.startsWith('http://localhost');
}

// ── Pages ──────────────────────────────────────────────────────────────────────

function loadConnectingPage(win, attempt) {
  if (!win || win.isDestroyed()) return;
  const dots  = '.'.repeat((attempt % 3) + 1);
  const label = TARGET_URL.startsWith('http://localhost')
    ? `Waiting for dev server${dots}`
    : `Connecting${dots}`;
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Segoe UI',system-ui,sans-serif;
    background:#09090b;color:#e4e4e7;
    display:flex;align-items:center;justify-content:center;
    min-height:100vh;text-align:center;padding-top:${TARGET_URL.startsWith('http://localhost') ? 46 : 38}px;
  }
  .card{max-width:360px;padding:32px}
  .logo{
    width:56px;height:56px;border-radius:14px;margin:0 auto 20px;
    background:linear-gradient(135deg,#0c4a6e,#0e7490 50%,#06b6d4);
    display:flex;align-items:center;justify-content:center;
    animation:pulse 2s ease-in-out infinite;
  }
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(6,182,212,.4)}50%{box-shadow:0 0 0 10px rgba(6,182,212,0)}}
  .logo svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:1.6;stroke-linecap:round}
  h1{font-size:16px;font-weight:600;letter-spacing:-.2px;margin-bottom:6px}
  p{font-size:11px;color:#52525b;line-height:1.6}
  code{font-family:Consolas,monospace;background:rgba(255,255,255,.05);
       padding:2px 6px;border-radius:4px;font-size:10px;color:#71717a}
  .bar{width:160px;height:2px;background:rgba(255,255,255,.06);
       border-radius:99px;margin:20px auto 0;overflow:hidden}
  .fill{height:100%;border-radius:99px;
        background:linear-gradient(90deg,#0e7490,#06b6d4);
        animation:scan 1.4s ease-in-out infinite}
  @keyframes scan{0%{width:0%;margin-left:0}50%{width:100%;margin-left:0}100%{width:0%;margin-left:100%}}
</style>
</head><body>
<div class="card">
  <div class="logo">
    <svg viewBox="0 0 24 24">
      <line x1="12" y1="2" x2="12" y2="6"/>
      <rect x="9" y="6" width="6" height="7" rx="1"/>
      <line x1="12" y1="13" x2="12" y2="17"/>
    </svg>
  </div>
  <h1>${label}</h1>
  <p>Reaching <code>${TARGET_URL}</code></p>
  <div class="bar"><div class="fill"></div></div>
</div>
</body></html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function loadErrorPage(win) {
  if (!win || win.isDestroyed()) return;
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Segoe UI',system-ui,sans-serif;
    background:#09090b;color:#e4e4e7;
    display:flex;align-items:center;justify-content:center;
    min-height:100vh;text-align:center;padding-top:46px;
  }
  .card{max-width:400px;padding:40px 32px}
  .icon{width:56px;height:56px;border-radius:14px;margin:0 auto 18px;
        background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);
        display:flex;align-items:center;justify-content:center;}
  .icon svg{width:26px;height:26px;stroke:#f87171;fill:none;stroke-width:1.6;stroke-linecap:round}
  h1{font-size:18px;font-weight:700;letter-spacing:-.3px;margin-bottom:9px}
  p{font-size:12px;color:#71717a;line-height:1.7;margin-bottom:6px}
  code{font-family:Consolas,monospace;background:rgba(255,255,255,.06);
       padding:2px 7px;border-radius:4px;font-size:11px;color:#94a3b8}
  .note{font-size:11px;color:#52525b;margin-bottom:28px}
  .btns{display:flex;flex-direction:column;gap:8px;align-items:center}
  button{padding:10px 28px;border:none;border-radius:8px;cursor:pointer;
         font-size:12px;font-weight:600;min-width:160px;
         transition:opacity .18s,transform .12s}
  button:active{transform:scale(.97)}
  .p{background:linear-gradient(135deg,#0c4a6e,#0e7490 50%,#06b6d4);
     color:#fff;box-shadow:0 4px 16px rgba(6,182,212,.28)}
  .p:hover{opacity:.84}
  .g{background:rgba(255,255,255,.04);
     border:1px solid rgba(255,255,255,.08);color:#71717a}
  .g:hover{background:rgba(255,255,255,.08);color:#a1a1aa}
</style>
</head><body>
<div class="card">
  <div class="icon">
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>
  <h1>Could not connect</h1>
  <p>AxiomPips could not reach<br/><code>${TARGET_URL}</code></p>
  <p class="note">Make sure the server is running, then retry.</p>
  <div class="btns">
    <button class="p" onclick="window.electronAPI?.reloadApp()">Retry</button>
    <button class="g" onclick="window.electronAPI?.openInBrowser()">Open in Browser</button>
  </div>
</div>
</body></html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// ── Server polling ─────────────────────────────────────────────────────────────
//
// Next.js doesn't compile pages until the first request hits the server.
// If the Electron app requests localhost:3000 before any browser has opened it,
// the server accepts the TCP connection but holds the HTTP response while
// compiling — which makes the window appear blank.
//
// This poller does a lightweight HTTP HEAD/GET check. When the server responds
// (even with a non-200 status — we just need ANY response), we know the page
// is ready and we call mainWindow.loadURL(TARGET_URL).
//
// For production (axiompips.com): the server always responds immediately so
// the first poll attempt succeeds and the page loads normally.

function pollServer(onReady, onGiveUp) {
  const MAX  = 60;   // give up after 60 attempts (60 seconds)
  const WAIT = 1000; // 1 second between attempts
  let   n    = 0;

  function attempt() {
    n++;
    if (n > MAX) { onGiveUp(); return; }

    // Refresh connecting page dots animation every 3 attempts
    if (mainWindow && !mainWindow.isDestroyed() && n > 1 && n % 3 === 0) {
      loadConnectingPage(mainWindow, n);
    }

    try {
      const parsed = new URL(TARGET_URL);
      const lib    = parsed.protocol === 'https:' ? https : http;

      const req = lib.request({
        method:   'HEAD',            // lightweight — don't fetch body
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     '/',
        timeout:  2000,
      }, (_res) => {
        // Any HTTP response means the server is alive and ready
        onReady();
      });

      req.setTimeout(2000, () => { req.destroy(); setTimeout(attempt, WAIT); });
      req.on('error',   ()  => setTimeout(attempt, WAIT));
      req.end();
    } catch (_) {
      setTimeout(attempt, WAIT);
    }
  }

  attempt();
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
    show:            true,       // always visible — splash overlay covers it
    title:           APP_NAME,
    frame:           false,      // custom title bar via preload
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  // Close splash after 2.8 s or when content is ready, whichever first
  mainWindow.once('ready-to-show', closeSplash);
  setTimeout(closeSplash, 2800);

  // Navigation security
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppUrl(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) { event.preventDefault(); shell.openExternal(url); }
  });

  // Runtime load failures (e.g. server goes down while app is open)
  mainWindow.webContents.on('did-fail-load', (_, errorCode) => {
    if (errorCode === -3) return; // -3 = aborted (SPA navigation)
    loadErrorPage(mainWindow);
  });

  mainWindow.on('maximize',   () => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('window-state', true);
  });
  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('window-state', false);
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  // Show connecting page immediately so the window isn't a black rectangle
  loadConnectingPage(mainWindow, 0);

  // Poll until the server is ready, then load the real URL.
  // This handles the Next.js cold-start compilation delay gracefully.
  pollServer(
    () => {
      // Server responded — load the actual app
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(TARGET_URL).catch(() => loadErrorPage(mainWindow));
      }
    },
    () => {
      // Timed out after 60 seconds
      if (mainWindow && !mainWindow.isDestroyed()) {
        loadErrorPage(mainWindow);
      }
    }
  );
}

// ── IPC ────────────────────────────────────────────────────────────────────────

ipcMain.handle('app-version',     () => APP_VERSION);
ipcMain.handle('platform',        () => process.platform);
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window-close',        () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// Retry — re-run the full poll + load sequence
ipcMain.handle('reload-app', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  loadConnectingPage(mainWindow, 0);
  pollServer(
    () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(TARGET_URL).catch(() => loadErrorPage(mainWindow));
      }
    },
    () => {
      if (mainWindow && !mainWindow.isDestroyed()) loadErrorPage(mainWindow);
    }
  );
});

ipcMain.handle('open-in-browser', () => shell.openExternal(TARGET_URL));
ipcMain.handle('open-external', (_, url) => {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'https:' || protocol === 'http:') shell.openExternal(url);
  } catch (_) {}
});
ipcMain.handle('zoom', (_, delta) => {
  if (!mainWindow) return;
  if (delta === 0) { mainWindow.webContents.setZoomFactor(1.0); return; }
  const next = mainWindow.webContents.getZoomFactor() + delta;
  mainWindow.webContents.setZoomFactor(Math.max(0.5, Math.min(2.0, next)));
});
ipcMain.handle('toggle-devtools', () => mainWindow?.webContents.toggleDevTools());

// ── Lifecycle ──────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createSplash();
  setTimeout(createMainWindow, 300);
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

process.on('uncaughtException', err => console.error('[uncaughtException]', err));
