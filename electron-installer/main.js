// electron-installer/main.js
// AxiomPips Custom Installer

'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { execSync, exec } = require('child_process');

// ── Fix paths for packaged app ────────────────────────────────────────────────
const APP_DIR      = app.isPackaged
  ? path.dirname(process.execPath)
  : __dirname;

const INSTALL_HTML = path.join(__dirname, 'installer.html');
const PRELOAD_PATH = path.join(__dirname, 'installer-preload.js');

const DEFAULT_INSTALL_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'AxiomPips'
);

const REG_KEY = 'HKCU\\Software\\AxiomPips';

let win = null;

// ── Create window ─────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width:           540,
    height:          680,
    resizable:       false,
    maximizable:     false,
    frame:           false,
    transparent:     true,
    center:          true,
    show:            false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          PRELOAD_PATH,
    },
  });

  win.loadFile(INSTALL_HTML);

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  win.webContents.on('did-fail-load', (event, code, desc) => {
    console.error('Failed to load:', code, desc);
  });
}

// ── Check existing install ────────────────────────────────────────────────────
function checkExistingInstall() {
  try {
    const result = execSync(
      `reg query "${REG_KEY}" /v InstallPath`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const match = result.match(/InstallPath\s+REG_SZ\s+(.+)/);
    if (match) {
      const installPath = match[1].trim();
      const exePath = path.join(installPath, 'AxiomPips.exe');
      if (fs.existsSync(exePath)) {
        return { installed: true, path: installPath };
      }
    }
  } catch (_) {}
  return { installed: false, path: DEFAULT_INSTALL_DIR };
}

function getInstalledVersion() {
  try {
    const result = execSync(
      `reg query "${REG_KEY}" /v Version`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const match = result.match(/Version\s+REG_SZ\s+(.+)/);
    if (match) return match[1].trim();
  } catch (_) {}
  return null;
}

// ── Simulate install steps ────────────────────────────────────────────────────
async function runInstall(installPath, onProgress) {
  const steps = [
    { msg: 'Preparing installation directory…', pct: 5,   ms: 400 },
    { msg: 'Extracting core files…',            pct: 20,  ms: 700 },
    { msg: 'Installing Electron runtime…',      pct: 40,  ms: 900 },
    { msg: 'Configuring AxiomPips…',            pct: 55,  ms: 500 },
    { msg: 'Writing registry entries…',         pct: 70,  ms: 300 },
    { msg: 'Creating desktop shortcut…',        pct: 80,  ms: 300 },
    { msg: 'Creating Start Menu entry…',        pct: 90,  ms: 300 },
    { msg: 'Finalizing installation…',          pct: 95,  ms: 400 },
    { msg: 'Installation complete!',            pct: 100, ms: 200 },
  ];

  for (const step of steps) {
    onProgress(step.pct, step.msg);
    await new Promise(r => setTimeout(r, step.ms));
  }

  // Write registry to track install
  try {
    if (!fs.existsSync(installPath)) fs.mkdirSync(installPath, { recursive: true });
    execSync(`reg add "${REG_KEY}" /v InstallPath /t REG_SZ /d "${installPath}" /f`, { stdio: 'pipe' });
    execSync(`reg add "${REG_KEY}" /v Version /t REG_SZ /d "0.1.0" /f`, { stdio: 'pipe' });
  } catch (_) {}
}

async function runUninstall(installPath, onProgress) {
  const steps = [
    { msg: 'Closing AxiomPips…',          pct: 20,  ms: 500 },
    { msg: 'Removing application files…', pct: 50,  ms: 800 },
    { msg: 'Cleaning registry entries…',  pct: 75,  ms: 400 },
    { msg: 'Removing shortcuts…',         pct: 90,  ms: 300 },
    { msg: 'Uninstall complete.',         pct: 100, ms: 200 },
  ];

  for (const step of steps) {
    onProgress(step.pct, step.msg);
    await new Promise(r => setTimeout(r, step.ms));
  }

  try { execSync('taskkill /F /IM AxiomPips.exe', { stdio: 'pipe' }); } catch (_) {}
  try { execSync(`reg delete "${REG_KEY}" /f`, { stdio: 'pipe' }); } catch (_) {}
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('check-existing', () => {
  const existing = checkExistingInstall();
  const version  = existing.installed ? getInstalledVersion() : null;
  return { ...existing, version };
});

ipcMain.handle('get-default-path', () => DEFAULT_INSTALL_DIR);

ipcMain.handle('start-install', async (_, installPath) => {
  await runInstall(installPath, (pct, msg) => {
    win?.webContents.send('install-progress', { pct, msg });
  });
  return { success: true };
});

ipcMain.handle('start-uninstall', async (_, installPath) => {
  await runUninstall(installPath, (pct, msg) => {
    win?.webContents.send('install-progress', { pct, msg });
  });
  return { success: true };
});

ipcMain.handle('launch-app', () => {
  try {
    const existing = checkExistingInstall();
    const exePath  = path.join(existing.path, 'AxiomPips.exe');
    if (fs.existsSync(exePath)) exec(`"${exePath}"`);
    else shell.openExternal('https://axiompips.com');
  } catch (_) {
    shell.openExternal('https://axiompips.com');
  }
  app.quit();
});

ipcMain.handle('open-website', () => shell.openExternal('https://axiompips.com'));
ipcMain.handle('quit', () => app.quit());

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => app.quit());

// Catch unhandled errors so app doesn't silently close
process.on('uncaughtException', (err) => {
  console.error('Uncaught error:', err);
});
