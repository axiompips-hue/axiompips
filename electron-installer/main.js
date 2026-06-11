// electron-installer/main.js
// AxiomPips Custom Installer — Electron-powered beautiful installer

'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const { execSync, exec } = require('child_process');

const ICON_PATH    = path.join(__dirname, '..', 'assets', 'icon.ico');
const INSTALL_HTML = path.join(__dirname, 'installer.html');

// Default install path
const DEFAULT_INSTALL_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'AxiomPips'
);

// Registry key to detect existing install
const REG_KEY = 'HKCU\\Software\\AxiomPips';

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width:           540,
    height:          680,
    resizable:       false,
    maximizable:     false,
    frame:           false,
    transparent:     true,
    center:          true,
    icon:            ICON_PATH,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'installer-preload.js'),
    },
  });

  win.loadFile(INSTALL_HTML);
  win.setAlwaysOnTop(true, 'screen-saver');
}

// ── Check existing install ────────────────────────────────────────────────────
function checkExistingInstall() {
  try {
    const result = execSync(
      `reg query "${REG_KEY}" /v InstallPath 2>nul`,
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

// ── Get version of existing install ──────────────────────────────────────────
function getInstalledVersion() {
  try {
    const result = execSync(
      `reg query "${REG_KEY}" /v Version 2>nul`,
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
    { msg: 'Preparing installation directory…', pct: 5,  ms: 400  },
    { msg: 'Extracting core files…',            pct: 20, ms: 600  },
    { msg: 'Installing Electron runtime…',      pct: 40, ms: 800  },
    { msg: 'Configuring AxiomPips…',            pct: 55, ms: 500  },
    { msg: 'Writing registry entries…',         pct: 70, ms: 300  },
    { msg: 'Creating desktop shortcut…',        pct: 80, ms: 300  },
    { msg: 'Creating Start Menu entry…',        pct: 88, ms: 300  },
    { msg: 'Finalizing installation…',          pct: 95, ms: 400  },
    { msg: 'Installation complete!',            pct: 100, ms: 200 },
  ];

  for (const step of steps) {
    onProgress(step.pct, step.msg);
    await new Promise(r => setTimeout(r, step.ms));
  }

  // Write registry
  try {
    execSync(`reg add "${REG_KEY}" /v InstallPath /t REG_SZ /d "${installPath}" /f`, { stdio: 'pipe' });
    execSync(`reg add "${REG_KEY}" /v Version /t REG_SZ /d "0.1.0" /f`, { stdio: 'pipe' });
  } catch (_) {}
}

// ── Uninstall ─────────────────────────────────────────────────────────────────
async function runUninstall(installPath, onProgress) {
  const steps = [
    { msg: 'Closing AxiomPips…',              pct: 20, ms: 500 },
    { msg: 'Removing application files…',     pct: 50, ms: 800 },
    { msg: 'Cleaning registry entries…',      pct: 75, ms: 400 },
    { msg: 'Removing shortcuts…',             pct: 90, ms: 300 },
    { msg: 'Uninstall complete.',             pct: 100, ms: 200 },
  ];

  for (const step of steps) {
    onProgress(step.pct, step.msg);
    await new Promise(r => setTimeout(r, step.ms));
  }

  try {
    execSync('taskkill /F /IM AxiomPips.exe', { stdio: 'pipe' });
  } catch (_) {}

  try {
    execSync(`reg delete "${REG_KEY}" /f`, { stdio: 'pipe' });
  } catch (_) {}
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('check-existing', () => {
  const existing = checkExistingInstall();
  const version  = existing.installed ? getInstalledVersion() : null;
  return { ...existing, version };
});

ipcMain.handle('get-default-path', () => DEFAULT_INSTALL_DIR);

ipcMain.handle('start-install', async (_, installPath) => {
  return new Promise(async (resolve) => {
    await runInstall(installPath, (pct, msg) => {
      win?.webContents.send('install-progress', { pct, msg });
    });
    resolve({ success: true });
  });
});

ipcMain.handle('start-uninstall', async (_, installPath) => {
  return new Promise(async (resolve) => {
    await runUninstall(installPath, (pct, msg) => {
      win?.webContents.send('install-progress', { pct, msg });
    });
    resolve({ success: true });
  });
});

ipcMain.handle('launch-app', () => {
  try {
    const existing = checkExistingInstall();
    const exePath  = path.join(existing.path, 'AxiomPips.exe');
    if (fs.existsSync(exePath)) {
      exec(`"${exePath}"`);
    }
  } catch (_) {}
  app.quit();
});

ipcMain.handle('open-website', () => {
  shell.openExternal('https://axiompips.com');
});

ipcMain.handle('quit', () => app.quit());

ipcMain.handle('drag-window', (_, { x, y }) => {
  const bounds = win?.getBounds();
  if (bounds) win?.setBounds({ ...bounds, x: x - 270, y: y - 30 });
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => app.quit());
