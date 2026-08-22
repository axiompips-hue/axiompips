// electron-installer/electron/preload.js
// Runs before every page in the main window.
// Two jobs:
//   1. Expose a safe API to renderer code via contextBridge.
//   2. Inject the custom title bar overlay (replaces the OS title bar that was
//      removed by frame:false in main.js).
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ── 1. API exposed to renderer ─────────────────────────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop:     true,
  getVersion:    ()      => ipcRenderer.invoke('app-version'),
  getPlatform:   ()      => ipcRenderer.invoke('platform'),
  openExternal:  (url)   => ipcRenderer.invoke('open-external', url),
  openInBrowser: ()      => ipcRenderer.invoke('open-in-browser'),
  reloadApp:     ()      => ipcRenderer.invoke('reload-app'),
  minimize:      ()      => ipcRenderer.invoke('window-minimize'),
  maximize:      ()      => ipcRenderer.invoke('window-maximize'),
  close:         ()      => ipcRenderer.invoke('window-close'),
  isMaximized:   ()      => ipcRenderer.invoke('window-is-maximized'),
});

// ── 2. Custom title bar injection ──────────────────────────────────────────────
//
// Injects a fixed 38px overlay at the top of every loaded page.
// This is how VS Code implements its custom title bar — a frameless OS window
// with a web-rendered title bar on top of the page content.
//
// The overlay contains:
//   - App logo + name (draggable)
//   - File / View / About dropdown menus
//   - Minimize / Maximize / Close buttons

const TB_H = 38; // title bar height in px

function buildTitleBar() {
  if (document.getElementById('__axm_tb')) return; // already injected

  // ── Styles ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = '__axm_tb_css';
  style.textContent = `
    #__axm_tb {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: ${TB_H}px;
      display: flex;
      align-items: center;
      z-index: 2147483647;
      background: rgba(9, 9, 11, 0.95);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      -webkit-app-region: drag;
      user-select: none;
      box-sizing: border-box;
    }
    #__axm_tb *, #__axm_tb *::before, #__axm_tb *::after { box-sizing: border-box; }

    /* ── Logo + title ──────────────────────────────────────────── */
    .atb-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px 0 14px;
      height: 100%;
      -webkit-app-region: drag;
      flex-shrink: 0;
    }
    .atb-logo {
      width: 18px; height: 18px;
      border-radius: 5px;
      background: linear-gradient(135deg, #0e7490, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .atb-logo svg {
      width: 10px; height: 10px;
      stroke: #fff; fill: none;
      stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
    }
    .atb-name {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.65);
      letter-spacing: -0.1px;
    }

    /* ── Drag region (centre) ──────────────────────────────────── */
    .atb-drag {
      flex: 1;
      height: 100%;
      -webkit-app-region: drag;
    }

    /* ── Menu bar ──────────────────────────────────────────────── */
    .atb-menus {
      display: flex;
      align-items: center;
      height: 100%;
      -webkit-app-region: no-drag;
      gap: 0;
    }
    .atb-mb {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      border: none;
      background: transparent;
      transition: color 0.12s, background 0.12s;
      -webkit-app-region: no-drag;
      white-space: nowrap;
    }
    .atb-mb:hover, .atb-mb.atb-open {
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.07);
    }

    /* ── Dropdown panel ────────────────────────────────────────── */
    .atb-dd {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      min-width: 220px;
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 5px;
      box-shadow:
        0 12px 40px rgba(0,0,0,0.65),
        0 4px 12px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.04);
      display: none;
      z-index: 2147483647;
    }
    .atb-mb.atb-open .atb-dd { display: block; }

    /* ── Dropdown items ────────────────────────────────────────── */
    .atb-item {
      display: flex;
      align-items: center;
      padding: 7px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: rgba(255,255,255,0.78);
      cursor: pointer;
      gap: 10px;
      transition: background 0.1s, color 0.1s;
    }
    .atb-item:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }
    .atb-item.atb-disabled {
      color: rgba(255,255,255,0.28);
      cursor: default;
      pointer-events: none;
    }
    .atb-item .atb-lbl { flex: 1; }
    .atb-item .atb-kbd {
      font-size: 10px;
      color: rgba(255,255,255,0.28);
      font-family: 'Consolas','Courier New',monospace;
      letter-spacing: 0.02em;
    }
    .atb-item .atb-ico {
      width: 14px; height: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .atb-item .atb-ico svg {
      width: 12px; height: 12px;
      stroke: rgba(255,255,255,0.4); fill: none;
      stroke-width: 1.8; stroke-linecap: round;
    }
    .atb-item:hover .atb-ico svg { stroke: rgba(255,255,255,0.75); }

    .atb-sep {
      height: 1px;
      background: rgba(255,255,255,0.07);
      margin: 4px 2px;
    }

    /* Section label inside dropdown */
    .atb-section {
      font-size: 10px;
      color: rgba(255,255,255,0.22);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 8px 10px 4px;
    }

    /* ── Window controls ───────────────────────────────────────── */
    .atb-ctrls {
      display: flex;
      align-items: center;
      height: 100%;
      -webkit-app-region: no-drag;
      margin-left: 4px;
    }
    .atb-ctrl {
      width: 46px; height: 100%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      border: none; background: transparent;
      color: rgba(255,255,255,0.5);
      transition: background 0.12s, color 0.12s;
      -webkit-app-region: no-drag;
    }
    .atb-ctrl:hover {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.95);
    }
    .atb-ctrl.atb-close:hover { background: #c42b1c; color: #fff; }
    .atb-ctrl svg {
      width: 10px; height: 10px;
      stroke: currentColor; fill: none;
      stroke-width: 1.3; stroke-linecap: round;
      pointer-events: none;
    }

    /* ── Body offset so content isn't hidden under title bar ───── */
    body.__axm_offset { padding-top: ${TB_H}px !important; }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────
  const tb = document.createElement('div');
  tb.id = '__axm_tb';
  tb.innerHTML = `
    <!-- Logo + name -->
    <div class="atb-brand">
      <div class="atb-logo">
        <svg viewBox="0 0 24 24">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <rect x="9" y="6" width="6" height="7" rx="1"/>
          <line x1="12" y1="13" x2="12" y2="17"/>
        </svg>
      </div>
      <span class="atb-name">AxiomPips</span>
    </div>

    <!-- Menu bar -->
    <div class="atb-menus">

      <!-- File -->
      <div class="atb-mb" data-menu="file">
        File
        <div class="atb-dd">
          <div class="atb-item" data-action="reload">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
            <span class="atb-lbl">Reload</span>
            <span class="atb-kbd">Ctrl+R</span>
          </div>
          <div class="atb-sep"></div>
          <div class="atb-item" data-action="close">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
            <span class="atb-lbl">Quit AxiomPips</span>
            <span class="atb-kbd">Ctrl+Q</span>
          </div>
        </div>
      </div>

      <!-- View -->
      <div class="atb-mb" data-menu="view">
        View
        <div class="atb-dd">
          <div class="atb-section">Zoom</div>
          <div class="atb-item" data-action="zoom-in">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></span>
            <span class="atb-lbl">Zoom In</span>
            <span class="atb-kbd">Ctrl++</span>
          </div>
          <div class="atb-item" data-action="zoom-out">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></span>
            <span class="atb-lbl">Zoom Out</span>
            <span class="atb-kbd">Ctrl+−</span>
          </div>
          <div class="atb-item" data-action="zoom-reset">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <span class="atb-lbl">Reset Zoom</span>
            <span class="atb-kbd">Ctrl+0</span>
          </div>
          <div class="atb-sep"></div>
          <div class="atb-section">Developer</div>
          <div class="atb-item" data-action="devtools" id="__atb_dt">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span>
            <span class="atb-lbl">Developer Tools</span>
            <span class="atb-kbd">F12</span>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="atb-mb" data-menu="about">
        About
        <div class="atb-dd">
          <div class="atb-item atb-disabled" id="__atb_ver">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg></span>
            <span class="atb-lbl">AxiomPips</span>
          </div>
          <div class="atb-sep"></div>
          <div class="atb-item" data-action="open-browser">
            <span class="atb-ico"><svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
            <span class="atb-lbl">Open in Browser</span>
          </div>
        </div>
      </div>

    </div><!-- /atb-menus -->

    <!-- Drag region -->
    <div class="atb-drag"></div>

    <!-- Window controls -->
    <div class="atb-ctrls">
      <button class="atb-ctrl atb-min" title="Minimize">
        <svg viewBox="0 0 10 1"><line x1="0" y1="0.5" x2="10" y2="0.5"/></svg>
      </button>
      <button class="atb-ctrl atb-max" title="Maximize" id="__atb_max">
        <svg viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" rx="0.5"/></svg>
      </button>
      <button class="atb-ctrl atb-close" title="Close">
        <svg viewBox="0 0 10 10"><line x1="0.5" y1="0.5" x2="9.5" y2="9.5"/><line x1="9.5" y1="0.5" x2="0.5" y2="9.5"/></svg>
      </button>
    </div>
  `;

  document.body.prepend(tb);
  document.body.classList.add('__axm_offset');

  // ── Populate version label async ─────────────────────────────────────────
  ipcRenderer.invoke('app-version').then(v => {
    const el = document.getElementById('__atb_ver');
    if (el) el.querySelector('.atb-lbl').textContent = `AxiomPips v${v}`;
  }).catch(() => {});

  // ── Hide DevTools item in production ─────────────────────────────────────
  // app.isPackaged is not available in renderer — check via a known flag
  // injected by main process (we just always show it; main guards the actual toggle)

  // ── Dropdown logic ───────────────────────────────────────────────────────
  function closeAll() {
    tb.querySelectorAll('.atb-mb.atb-open').forEach(b => b.classList.remove('atb-open'));
  }

  tb.querySelectorAll('.atb-mb').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = btn.classList.contains('atb-open');
      closeAll();
      if (!wasOpen) btn.classList.add('atb-open');
    });
    // Hover-to-switch menus (if one is already open)
    btn.addEventListener('mouseenter', () => {
      if (tb.querySelector('.atb-mb.atb-open') && !btn.classList.contains('atb-open')) {
        closeAll();
        btn.classList.add('atb-open');
      }
    });
  });

  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  // ── Menu item actions ────────────────────────────────────────────────────
  tb.querySelectorAll('.atb-item[data-action]').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      closeAll();
      const a = item.dataset.action;
      if      (a === 'reload')       ipcRenderer.invoke('reload-app');
      else if (a === 'close')        ipcRenderer.invoke('window-close');
      else if (a === 'zoom-in')      ipcRenderer.invoke('zoom',  +0.1);
      else if (a === 'zoom-out')     ipcRenderer.invoke('zoom',  -0.1);
      else if (a === 'zoom-reset')   ipcRenderer.invoke('zoom',   0);
      else if (a === 'devtools')     ipcRenderer.invoke('toggle-devtools');
      else if (a === 'open-browser') ipcRenderer.invoke('open-in-browser');
    });
  });

  // ── Window control buttons ───────────────────────────────────────────────
  tb.querySelector('.atb-min').addEventListener('click',   () => ipcRenderer.invoke('window-minimize'));
  tb.querySelector('.atb-max').addEventListener('click',   () => ipcRenderer.invoke('window-maximize'));
  tb.querySelector('.atb-close').addEventListener('click', () => ipcRenderer.invoke('window-close'));

  // Maximize icon ↔ restore icon when window state changes
  ipcRenderer.on('window-state', (_, maximized) => {
    const btn = document.getElementById('__atb_max');
    if (!btn) return;
    btn.title = maximized ? 'Restore' : 'Maximize';
    btn.querySelector('svg').innerHTML = maximized
      ? '<path d="M2 8h6v6H2zM4 2h6v6H4" stroke="currentColor"/>'     // restore icon
      : '<rect x="0.5" y="0.5" width="9" height="9" rx="0.5"/>'; // maximize icon
  });

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  // Capture phase (true) so we intercept before the page's own handlers.
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'r') { e.preventDefault(); ipcRenderer.invoke('reload-app'); }
    if (e.ctrlKey && e.key === 'q') { e.preventDefault(); ipcRenderer.invoke('window-close'); }
    if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); ipcRenderer.invoke('zoom', +0.1); }
    if (e.ctrlKey && e.key === '-') { e.preventDefault(); ipcRenderer.invoke('zoom', -0.1); }
    if (e.ctrlKey && e.key === '0') { e.preventDefault(); ipcRenderer.invoke('zoom', 0); }
    if (e.key === 'F12')            { e.preventDefault(); ipcRenderer.invoke('toggle-devtools'); }
  }, true);
}

// Inject as early as possible — the DOM might not be fully ready yet.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildTitleBar);
} else {
  buildTitleBar();
}
