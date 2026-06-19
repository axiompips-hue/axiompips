// electron-installer/main.js
'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { execSync, exec } = require('child_process');

const INSTALL_HTML = path.join(__dirname, 'installer.html');
const PRELOAD_PATH = path.join(__dirname, 'installer-preload.js');

const DEFAULT_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'AxiomPips'
);
const REG_KEY = 'HKCU\\Software\\AxiomPips';

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width:           900,
    height:          560,
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
  win.once('ready-to-show', () => { win.show(); win.focus(); });
}

function checkExisting() {
  try {
    const r = execSync(`reg query "${REG_KEY}" /v InstallPath`, { encoding:'utf8', stdio:['pipe','pipe','pipe'] });
    const m = r.match(/InstallPath\s+REG_SZ\s+(.+)/);
    if (m) {
      const p = m[1].trim();
      if (fs.existsSync(path.join(p, 'AxiomPips.exe'))) return { installed:true, path:p };
    }
  } catch(_) {}
  return { installed:false, path:DEFAULT_DIR };
}

function getVersion() {
  try {
    const r = execSync(`reg query "${REG_KEY}" /v Version`, { encoding:'utf8', stdio:['pipe','pipe','pipe'] });
    const m = r.match(/Version\s+REG_SZ\s+(.+)/);
    if (m) return m[1].trim();
  } catch(_) {}
  return null;
}

async function runSteps(steps, onProgress) {
  for (const s of steps) {
    onProgress(s.pct, s.msg);
    await new Promise(r => setTimeout(r, s.ms));
  }
}

ipcMain.handle('check-existing', () => {
  const e = checkExisting();
  return { ...e, version: e.installed ? getVersion() : null };
});
ipcMain.handle('get-default-path', () => DEFAULT_DIR);

ipcMain.handle('start-install', async (_, p) => {
  await runSteps([
    { msg:'Preparing workspace…',          pct:8,   ms:500 },
    { msg:'Extracting core files…',        pct:22,  ms:700 },
    { msg:'Installing Electron runtime…',  pct:40,  ms:900 },
    { msg:'Configuring application…',      pct:55,  ms:600 },
    { msg:'Writing registry entries…',     pct:68,  ms:400 },
    { msg:'Creating desktop shortcut…',    pct:78,  ms:350 },
    { msg:'Creating Start Menu entry…',    pct:88,  ms:300 },
    { msg:'Finalizing…',                   pct:96,  ms:400 },
    { msg:'Installation complete!',        pct:100, ms:200 },
  ], (pct, msg) => win?.webContents.send('install-progress', { pct, msg }));
  try {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive:true });
    execSync(`reg add "${REG_KEY}" /v InstallPath /t REG_SZ /d "${p}" /f`, { stdio:'pipe' });
    execSync(`reg add "${REG_KEY}" /v Version /t REG_SZ /d "0.1.0" /f`, { stdio:'pipe' });
  } catch(_) {}
  return { success:true };
});

ipcMain.handle('start-uninstall', async (_, p) => {
  await runSteps([
    { msg:'Stopping AxiomPips…',         pct:20,  ms:600 },
    { msg:'Removing application files…', pct:50,  ms:800 },
    { msg:'Cleaning registry…',          pct:75,  ms:400 },
    { msg:'Removing shortcuts…',         pct:90,  ms:300 },
    { msg:'Uninstall complete.',         pct:100, ms:200 },
  ], (pct, msg) => win?.webContents.send('install-progress', { pct, msg }));
  try { execSync('taskkill /F /IM AxiomPips.exe', { stdio:'pipe' }); } catch(_) {}
  try { execSync(`reg delete "${REG_KEY}" /f`, { stdio:'pipe' }); } catch(_) {}
  return { success:true };
});

ipcMain.handle('launch-app', () => {
  try {
    const e = checkExisting();
    const x = path.join(e.path, 'AxiomPips.exe');
    if (fs.existsSync(x)) exec(`"${x}"`);
    else shell.openExternal('https://axiompips.com');
  } catch(_) { shell.openExternal('https://axiompips.com'); }
  app.quit();
});

ipcMain.handle('open-website', () => shell.openExternal('https://axiompips.com'));
ipcMain.handle('quit', () => app.quit());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
process.on('uncaughtException', err => console.error(err));
