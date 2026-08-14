// electron-installer/electron/config.js
'use strict';

// ─── URL CONFIGURATION ────────────────────────────────────────────────────────
// Development:  TARGET_URL = 'http://localhost:3000'
// Production:   TARGET_URL = 'https://axiompips.com'
//
// ► Change TARGET_URL to 'https://axiompips.com' before building for release.
//   That single line is the only change needed to ship the production build.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

// Read version from the installer's package.json at the root of electron-installer/.
// Doing this at require-time is fine — config.js is loaded once at startup.
let pkgVersion = '0.1.0';
try {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkgVersion    = pkg.version || pkgVersion;
} catch (_) {
  // Falls back to the default above if package.json can't be read.
}

const APP_NAME    = 'AxiomPips';
const APP_VERSION = pkgVersion;
const TARGET_URL  = 'http://localhost:3000'; // ← Change to 'https://axiompips.com' when live

module.exports = { APP_NAME, APP_VERSION, TARGET_URL };
