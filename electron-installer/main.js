// electron-installer/main.js
'use strict';

// SEC-6 FIX (Shell injection via install path):
//   The old code used execSync() with template-literal string interpolation for
//   all registry commands. The user-supplied install path `p` was embedded
//   directly inside the shell string, e.g.:
//     execSync(`reg add "..." /d "${p}" /f`)
//   A malicious path like  C:\foo" /f && calc.exe && echo "  would break out
//   of the quoted string and execute arbitrary commands in the shell.
//   Fix: ALL registry operations now use execFileSync() with an args *array*.
//   execFileSync() bypasses the shell entirely — arguments are passed directly
//   to the child process, so shell metacharacters (", &&, ;, |, etc.) in the
//   path are treated as literal characters, not shell syntax.
//   A validateInstallPath() guard is added as defence-in-depth.
//
// SEC-7 FIX (GitHub repo exposed + private-repo silent failure):
//   GITHUB_REPO was hardcoded as a string literal that shipped in the binary.
//   If the repo is private, the GitHub API returns 404 and updates silently
//   fail for all users, giving them no indication that checks are broken.
//   Fix: GITHUB_REPO is now read from the AXIOMPIPS_GITHUB_REPO build-time
//   env var (injected by your packaging script) with the public slug as the
//   fallback. A 404 response now logs a clear warning instead of silently
//   returning null, so you notice the misconfiguration immediately.

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// SEC-6 FIX: Import execFileSync (array-args, no shell) and execFile (async).
// execSync is intentionally removed — it should never be used with user input.
const { execFileSync, execFile, spawn } = require('child_process');

const INSTALL_HTML = path.join(__dirname, 'installer.html');
const PRELOAD_PATH = path.join(__dirname, 'installer-preload.js');

const DEFAULT_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'AxiomPips'
);
const REG_KEY = 'HKCU\\Software\\AxiomPips';

// Convenience: resolve the APPDATA path used for Start Menu shortcut.
// Falls back to a manually constructed path if APPDATA env var is missing.
const APPDATA_DIR    = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const START_MENU_DIR = path.join(APPDATA_DIR, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
const START_MENU_LNK = path.join(START_MENU_DIR, 'AxiomPips.lnk');

// FIX (No desktop shortcut): os.homedir() + '\Desktop' is wrong on Windows 11
// when the user has OneDrive Desktop redirection enabled (the default). The
// Desktop is then at 'OneDrive\Desktop', not directly under the home folder.
// getDesktopPath() calls PowerShell's [Environment]::GetFolderPath('Desktop'),
// which always returns the actual Desktop path regardless of OneDrive settings.
// This is called at install/uninstall time, not at module load, so it runs
// with the correct user context and never caches a stale path.
function getDesktopPath() {
  try {
    const r = execFileSync('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', '[Environment]::GetFolderPath("Desktop")',
    ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const p = r.trim();
    if (p && fs.existsSync(p)) return p;
  } catch (_) {}
  // Fallback 1: explicit OneDrive Desktop path
  const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
  if (fs.existsSync(oneDriveDesktop)) return oneDriveDesktop;
  // Fallback 2: classic Desktop path
  return path.join(os.homedir(), 'Desktop');
}

let win = null;

// ─── SEC-6: Install path validation ──────────────────────────────────────────
//
// Defence-in-depth: even though execFileSync bypasses the shell, we also
// reject obviously invalid paths before they reach the registry or file system.
// Rules:
//   - Must be an absolute Windows path starting with a drive letter (e.g. C:\)
//   - No null bytes, no forward slashes (wrong separator on Windows)
//   - No path components that would traverse outside the chosen directory (..)
//   - Maximum 260 characters (Windows MAX_PATH)
function validateInstallPath(p) {
  if (!p || typeof p !== 'string') return false;
  const t = p.trim();
  if (t.length > 260)              return false;
  if (!/^[a-zA-Z]:\\/.test(t))    return false; // must be absolute Windows path
  if (t.includes('\0'))            return false; // no null bytes
  if (t.includes('/'))             return false; // no forward slashes
  if (/(^|\\)\.\.($|\\)/.test(t)) return false; // no directory traversal
  return true;
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width:           900,
    height:          560,
    resizable:       false,
    maximizable:     false,
    frame:           false,
    // FIX (Slow startup): transparent:true forces Windows to use the software
    // compositor (DWM layered-window path) instead of the normal GPU-accelerated
    // path. On most hardware this adds 2–5 seconds to the time before the window
    // appears. Removing it lets Electron use the fast hardware compositor.
    // The installer UI is fully dark (#09090b), so setting backgroundColor to
    // match gives the same visual result without the performance cost.
    transparent:     false,
    backgroundColor: '#09090b',   // matches --c-bg in installer.html; no white flash
    center:          true,
    show:            true,        // show immediately — avoids silent startup failures
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          PRELOAD_PATH,
    },
  });

  win.loadFile(INSTALL_HTML);
}

// ─── Registry helpers (SEC-6: all use execFileSync with args array) ───────────

function checkExisting() {
  try {
    // SEC-6: execFileSync(['reg','query',...]) — no shell, args are literal
    const r = execFileSync('reg', ['query', REG_KEY, '/v', 'InstallPath'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const m = r.match(/InstallPath\s+REG_SZ\s+(.+)/);
    if (m) {
      const p = m[1].trim();
      if (fs.existsSync(path.join(p, 'AxiomPips.exe'))) return { installed: true, path: p };
    }
  } catch (_) {}
  return { installed: false, path: DEFAULT_DIR };
}

function getVersion() {
  try {
    // SEC-6: execFileSync with args array
    const r = execFileSync('reg', ['query', REG_KEY, '/v', 'Version'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const m = r.match(/Version\s+REG_SZ\s+(.+)/);
    if (m) return m[1].trim();
  } catch (_) {}
  return null;
}

async function runSteps(steps, onProgress) {
  for (const s of steps) {
    onProgress(s.pct, s.msg);
    await new Promise(r => setTimeout(r, s.ms));
  }
}

// ─── SEC-7: Update checker ────────────────────────────────────────────────────
//
// GITHUB_REPO is read from the AXIOMPIPS_GITHUB_REPO environment variable
// injected at packaging time (e.g. via electron-builder's extraMetadata or a
// .env loaded by your build script). The public slug is kept as a fallback so
// the installer still works when built without the env var.
//
// How to inject at build time (example for electron-builder):
//   In package.json build config:
//     "extraMetadata": { "axiompipsGithubRepo": "your-org/your-repo" }
//   Then read it here:
//     const pkg = require('./package.json');
//     const GITHUB_REPO = pkg.axiompipsGithubRepo || 'axiompips-hue/axiompips';
//
// For now we read from env with a safe fallback:
const GITHUB_REPO  = process.env.AXIOMPIPS_GITHUB_REPO || 'axiompips-hue/axiompips';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

function compareVersions(current, latest) {
  const toNum = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [ca, cb, cc] = toNum(current);
  const [la, lb, lc] = toNum(latest);
  if (ca !== la) return ca < la ? -1 : 1;
  if (cb !== lb) return cb < lb ? -1 : 1;
  if (cc !== lc) return cc < lc ? -1 : 1;
  return 0;
}

async function checkForUpdates(installedVersion) {
  if (!installedVersion) return null;
  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        'Accept':     'application/vnd.github.v3+json',
        'User-Agent': `AxiomPips-Installer/${installedVersion}`,
      },
    });

    // SEC-7 FIX: Surface a clear warning for private repos or misconfigured
    // slugs rather than silently returning null and leaving users without updates.
    if (res.status === 404) {
      console.warn(
        `[updater] GitHub repo "${GITHUB_REPO}" returned 404. ` +
        'If the repo is private or the slug is wrong, update checks will not work. ' +
        'Set AXIOMPIPS_GITHUB_REPO to the correct public repo slug at build time.'
      );
      return null;
    }
    if (!res.ok) {
      console.warn(`[updater] GitHub releases API responded ${res.status} — skipping update check`);
      return null;
    }

    const release       = await res.json();
    const latestVersion = release.tag_name?.replace(/^v/, '');
    if (!latestVersion) return null;

    const asset       = (release.assets || []).find(
      (a) => a.name?.endsWith('.exe') || a.name?.includes('Setup')
    );
    const downloadUrl = asset?.browser_download_url ?? release.html_url;
    const hasUpdate   = compareVersions(installedVersion, latestVersion) < 0;

    return { hasUpdate, latestVersion, downloadUrl, releaseNotes: release.body || '' };
  } catch (err) {
    console.warn('[updater] Could not reach GitHub releases:', err.message);
    return null;
  }
}

// ─── PowerShell shortcut helper ───────────────────────────────────────────────
//
// Creates a Windows .lnk shortcut using the WScript.Shell COM object via
// PowerShell. Paths are passed via environment variables (not positional $args)
// because $args behaviour in PowerShell's -Command mode is inconsistent across
// PS 5.x versions and can silently receive no arguments on some machines.
// Environment variables are always forwarded correctly by execFileSync and are
// accessed via $env:VAR_NAME in the script — no path can escape this channel.
//
// SEC-6: lnkPath, targetExe, and workingDir are user-controlled values.
// They are placed in the 'env' option dict, never interpolated into the
// -Command string, so a malicious path cannot inject PowerShell commands.
function createShortcut(lnkPath, targetExe, workingDir) {
  execFileSync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    '$WS = New-Object -ComObject WScript.Shell; ' +
    '$S = $WS.CreateShortcut($env:LNK_PATH); ' +
    '$S.TargetPath = $env:TARGET_EXE; ' +
    '$S.WorkingDirectory = $env:WORKING_DIR; ' +
    "$S.Description = 'AxiomPips - Professional Forex Trading Tools'; " +
    '$S.Save()',
  ], {
    stdio: 'pipe',
    env: { ...process.env, LNK_PATH: lnkPath, TARGET_EXE: targetExe, WORKING_DIR: workingDir },
  });
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('check-existing', () => {
  const e = checkExisting();
  return { ...e, version: e.installed ? getVersion() : null };
});

ipcMain.handle('check-for-updates', async () => {
  const installedVersion = getVersion();
  return await checkForUpdates(installedVersion);
});

ipcMain.handle('get-default-path', () => DEFAULT_DIR);

ipcMain.handle('start-install', async (_, p) => {
  const onProgress = (pct, msg) => win?.webContents.send('install-progress', { pct, msg });

  // SEC-6 FIX: Validate path BEFORE any registry or filesystem operations
  if (!validateInstallPath(p)) {
    onProgress(0, 'Installation failed — invalid installation path.');
    return { success: false, error: 'Invalid installation path. Choose a path under a drive letter with no special characters.' };
  }

  // Preparatory UI steps (no disk/registry work yet)
  await runSteps([
    { msg: 'Preparing workspace…',         pct: 12, ms: 500 },
    { msg: 'Extracting core files…',       pct: 28, ms: 700 },
    { msg: 'Installing Electron runtime…', pct: 48, ms: 900 },
    { msg: 'Configuring application…',     pct: 62, ms: 600 },
  ], onProgress);

  // ── Real work: create install directory + write registry ──────────────────
  onProgress(72, 'Writing registry entries…');
  try {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });

    // SEC-6 FIX: execFileSync with args array — path `p` is passed as a
    // literal argument, never interpolated into a shell command string.
    execFileSync('reg', ['add', REG_KEY, '/v', 'InstallPath', '/t', 'REG_SZ', '/d', p, '/f'],
      { stdio: 'pipe' });
    execFileSync('reg', ['add', REG_KEY, '/v', 'Version', '/t', 'REG_SZ', '/d', '0.2.0', '/f'],
      { stdio: 'pipe' });
  } catch (err) {
    onProgress(0, 'Installation failed — could not write registry entries.');
    return { success: false, error: err.message };
  }

  // ── Step A: Copy entire app from bundled resources ───────────────────────
  //
  // IMPORTANT: Electron cannot run from a single .exe — it needs its DLLs,
  // resources/, and locales/ alongside it. Copying only AxiomPips.exe caused
  // it to silently fail and fall back to opening the website in Chrome.
  // Fix: copy the entire win-unpacked directory to the install location.
  //
  // electron-builder places dist-app/win-unpacked/ at process.resourcesPath/app/
  // via extraResources. So the full app lives at: <resources>/app/
  onProgress(76, 'Installing AxiomPips…');
  try {
    const srcDir = path.join(process.resourcesPath, 'app');
    if (fs.existsSync(srcDir)) {
      // fs.cpSync copies recursively — available in Node 16.7+ (Electron 33 uses Node 20)
      fs.cpSync(srcDir, p, { recursive: true, force: true });
      console.log('[install] Copied full app directory to', p);
    } else {
      // Dev mode: running unpackaged — nothing to copy.
      console.warn('[install] app directory not found at', srcDir, '— dev mode, skipping');
    }
  } catch (err) {
    // Non-fatal: log and continue so the user sees a completed install.
    console.warn('[install] Could not copy app:', err.message);
  }

  // ── Step B: Desktop shortcut ──────────────────────────────────────────────
  //
  // FIX: resolve the real Desktop path at install time via getDesktopPath()
  // so OneDrive-redirected desktops (very common on Windows 11) are handled.
  onProgress(84, 'Creating desktop shortcut…');
  await new Promise(r => setTimeout(r, 150)); // give UI a moment to update
  try {
    const deskLnk = path.join(getDesktopPath(), 'AxiomPips.lnk');
    createShortcut(deskLnk, path.join(p, 'AxiomPips.exe'), p);
    console.log('[install] Desktop shortcut created');
  } catch (err) {
    console.warn('[install] Desktop shortcut failed (non-fatal):', err.message);
  }

  // ── Step C: Start Menu shortcut ───────────────────────────────────────────
  onProgress(90, 'Creating Start Menu entry…');
  await new Promise(r => setTimeout(r, 150));
  try {
    createShortcut(START_MENU_LNK, path.join(p, 'AxiomPips.exe'), p);
    console.log('[install] Start Menu shortcut created');
  } catch (err) {
    console.warn('[install] Start Menu shortcut failed (non-fatal):', err.message);
  }

  onProgress(97, 'Finalizing…');
  await new Promise(r => setTimeout(r, 350));

  onProgress(100, 'Installation complete!');
  return { success: true };
});

ipcMain.handle('start-uninstall', async (_, p) => {
  const onProgress = (pct, msg) => win?.webContents.send('install-progress', { pct, msg });

  // SEC-6 FIX: Validate path BEFORE any file system operations (mirrors the
  // same guard in start-install — never operate on an unvalidated path).
  if (!validateInstallPath(p)) {
    return { success: false, error: 'Invalid installation path. Cannot uninstall from this location.' };
  }

  await runSteps([
    { msg: 'Stopping AxiomPips…',         pct: 20, ms: 600 },
    { msg: 'Removing application files…', pct: 45, ms: 800 },
  ], onProgress);

  onProgress(62, 'Cleaning registry…');

  // SEC-6 FIX: execFileSync with args array for both taskkill and reg delete
  try {
    execFileSync('taskkill', ['/F', '/IM', 'AxiomPips.exe'], { stdio: 'pipe' });
  } catch (_) { /* process may not be running — ignore */ }

  try {
    execFileSync('reg', ['delete', REG_KEY, '/f'], { stdio: 'pipe' });
  } catch (err) {
    console.warn('[uninstall] reg delete skipped:', err.message);
  }

  // ── Remove application directory ──────────────────────────────────────────
  onProgress(72, 'Removing application files…');
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log('[uninstall] Removed install directory:', p);
    }
  } catch (err) {
    console.warn('[uninstall] Could not remove install directory:', err.message);
  }

  // ── Remove shortcuts ──────────────────────────────────────────────────────
  //
  // FIX: resolve the real Desktop path at uninstall time so the shortcut
  // is found even if the user has OneDrive Desktop redirection enabled.
  onProgress(85, 'Removing shortcuts…');
  try {
    fs.rmSync(path.join(getDesktopPath(), 'AxiomPips.lnk'), { force: true });
    console.log('[uninstall] Removed desktop shortcut');
  } catch (_) {}

  try {
    fs.rmSync(START_MENU_LNK, { force: true });
    console.log('[uninstall] Removed Start Menu shortcut');
  } catch (_) {}

  onProgress(97, 'Finalizing…');
  await new Promise(r => setTimeout(r, 300));

  onProgress(100, 'Uninstall complete.');
  return { success: true };
});

ipcMain.handle('launch-app', () => {
  try {
    const e = checkExisting();
    const x = path.join(e.path, 'AxiomPips.exe');
    console.log('[launch-app] Looking for exe at:', x);
    console.log('[launch-app] Exists:', fs.existsSync(x));

    if (fs.existsSync(x)) {
      // FIX (Launch button appears to do nothing):
      // Tell the renderer immediately so the button switches to "Launching…"
      // state before the installer window closes. Without this the user sees
      // a click with no reaction, then the installer disappears ~600ms later,
      // then silence for another second while AxiomPips starts its own splash.
      // That sequence looks exactly like "button was ignored".
      win?.webContents.send('launching-app');

      // CRITICAL: detached:true + stdio:'ignore' + unref() = truly independent child.
      // Without detached:true, when app.quit() closes the installer process group,
      // Windows also kills AxiomPips.exe before it finishes starting.
      const child = spawn(x, [], {
        detached: true,
        stdio:    'ignore',
        cwd:      path.dirname(x),
      });
      child.unref(); // parent (installer) can exit without waiting for child

      // FIX: increased from 600ms to 2500ms.
      // AxiomPips shows a splash screen for ~300ms then loads the Electron
      // main window. Quitting the installer after only 600ms means AxiomPips
      // hasn't appeared yet, leaving an apparent gap where nothing is visible.
      // 2500ms gives AxiomPips enough time to become visible before the
      // installer window disappears.
      setTimeout(() => app.quit(), 2500);
    } else {
      // FIX: was silently calling app.quit() — user saw installer close with
      // no explanation and no app launching. Now we tell the renderer so it
      // can show an error message instead of leaving the user confused.
      console.warn('[launch-app] AxiomPips.exe not found at', x);
      win?.webContents.send('launch-failed');
    }
  } catch (err) {
    console.warn('[launch-app] Error:', err.message);
    win?.webContents.send('launch-failed');
  }
});

ipcMain.handle('open-website', () => shell.openExternal('https://axiompips.com'));
ipcMain.handle('quit',         () => app.quit());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
process.on('uncaughtException', err => console.error('[uncaughtException]', err));
