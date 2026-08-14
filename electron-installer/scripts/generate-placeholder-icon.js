#!/usr/bin/env node
// electron-installer/scripts/generate-placeholder-icon.js
//
// Generates placeholder icon files so the build succeeds before real artwork
// is ready. Uses ONLY Node.js built-in modules — no npm packages.
//
// Creates:
//   electron/assets/icon.png  — 64×64 dark PNG (#0d0e11)
//   electron/assets/icon.ico  — same PNG bytes (electron-builder converts on Windows)
//
// Run via: npm run generate-icons
//
// NOTE: These are PLACEHOLDERS. Replace with real icons before release.
//       See electron/assets/ICON_INSTRUCTIONS.md for instructions.
'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 (needed for PNG chunk integrity) ─────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk writer ───────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const len  = Buffer.alloc(4);
  const crc  = Buffer.alloc(4);
  const tBuf = Buffer.from(type, 'ascii');
  len.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([tBuf, data])), 0);
  return Buffer.concat([len, tBuf, data, crc]);
}

// ── Generate a solid-colour RGB PNG ───────────────────────────────────────────
function makePNG(width, height, r, g, b) {
  // Raw scanlines: 1 filter byte + width * 3 RGB bytes per row
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0; // filter: None
  for (let x = 0; x < width; x++) {
    row[1 + x * 3]     = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const rawData   = Buffer.concat(Array.from({ length: height }, () => row));
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // color type: RGB (truecolour)
  ihdr[10] = 0; // compression method: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Write files ────────────────────────────────────────────────────────────────
const assetsDir = path.resolve(__dirname, '..', 'electron', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// AxiomPips dark background: #0d0e11 = rgb(13, 14, 17)
const placeholder = makePNG(256, 256, 0x0d, 0x0e, 0x11);

let wrote = 0;

function writeIfAbsent(filePath, data, label) {
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${label} already exists — keeping existing file`);
    return;
  }
  fs.writeFileSync(filePath, data);
  console.log(`  ✓ Wrote placeholder ${label}`);
  wrote++;
}

console.log('\nAxiomPips — generating placeholder icons…\n');
writeIfAbsent(path.join(assetsDir, 'icon.png'), placeholder, 'icon.png (256×256 dark)');
writeIfAbsent(path.join(assetsDir, 'icon.ico'), placeholder, 'icon.ico  (PNG bytes — electron-builder converts on Windows)');

if (wrote > 0) {
  console.log('\n⚠  Placeholder icons written. Replace with real artwork before release.');
  console.log('   See electron/assets/ICON_INSTRUCTIONS.md for instructions.\n');
} else {
  console.log('\n  All icons already present — nothing changed.\n');
}
