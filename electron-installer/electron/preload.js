// electron-installer/electron/preload.js
// Runs in an isolated context before every page loaded in the main window.
// Two responsibilities:
//   1. Expose safe APIs to renderer code via contextBridge.
//   2. Inject the custom title bar overlay (replaces the native OS title bar
//      removed by frame:false in main.js). Wrapped in try/catch so any failure
//      here cannot affect the main window rendering.
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ── 1. Safe renderer API ───────────────────────────────────────────────────────
// This runs first and unconditionally so the API is always available,
// even if the title bar injection below fails.

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

// ── 2. Custom title bar ────────────────────────────────────────────────────────

const TB_H = 38; // title bar height px

function buildTitleBar() {
  try {
    if (document.getElementById('__axm_tb')) return;
    if (!document.body) return; // body not ready yet — caller should retry

    // ── Styles ───────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.id = '__axm_tb_css';
    style.textContent = `
      #__axm_tb {
        position: fixed; top: 0; left: 0; right: 0;
        height: ${TB_H}px;
        display: flex; align-items: center;
        z-index: 2147483647;
        background: rgba(9,9,11,0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        -webkit-app-region: drag;
        user-select: none;
        box-sizing: border-box;
      }
      #__axm_tb *, #__axm_tb *::before, #__axm_tb *::after {
        box-sizing: border-box;
      }

      /* Brand */
      .atb-brand {
        display: flex; align-items: center; gap: 7px;
        padding: 0 10px 0 14px; height: 100%;
        -webkit-app-region: drag; flex-shrink: 0;
      }
      .atb-logo {
        width: 18px; height: 18px; border-radius: 5px;
        background: linear-gradient(135deg, #0e7490, #06b6d4);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .atb-logo svg { width: 10px; height: 10px; stroke: #fff; fill: none;
                      stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .atb-name { font-size: 12px; font-weight: 600;
                  color: rgba(255,255,255,0.65); letter-spacing: -0.1px; }

      /* Drag fill */
      .atb-drag { flex: 1; height: 100%; -webkit-app-region: drag; }

      /* Menu buttons */
      .atb-menus { display: flex; align-items: center; height: 100%;
                   -webkit-app-region: no-drag; }
      .atb-mb {
        position: relative; height: 100%;
        display: flex; align-items: center; padding: 0 12px;
        font-size: 12px; color: rgba(255,255,255,0.55);
        cursor: pointer; border: none; background: transparent;
        transition: color .12s, background .12s;
        -webkit-app-region: no-drag; white-space: nowrap;
      }
      .atb-mb:hover, .atb-mb.atb-open {
        color: rgba(255,255,255,0.9);
        background: rgba(255,255,255,0.07);
      }

      /* Dropdown */
      .atb-dd {
        position: absolute; top: calc(100% + 2px); left: 0;
        min-width: 220px;
        background: #18181b;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px; padding: 5px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.04);
        display: none; z-index: 2147483647;
      }
      .atb-mb.atb-open .atb-dd { display: block; }

      /* Items */
      .atb-item {
        display: flex; align-items: center; padding: 7px 10px;
        border-radius: 5px; font-size: 12px;
        color: rgba(255,255,255,0.78);
        cursor: pointer; gap: 10px;
        transition: background .1s, color .1s;
      }
      .atb-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .atb-item.atb-dis { color: rgba(255,255,255,0.28);
                          cursor: default; pointer-events: none; }
      .atb-lbl { flex: 1; }
      .atb-kbd { font-size: 10px; color: rgba(255,255,255,0.28);
                 font-family: Consolas,'Courier New',monospace; }
      .atb-ico { width: 14px; height: 14px; flex-shrink: 0;
                 display: flex; align-items: center; justify-content: center; }
      .atb-ico svg { width: 12px; height: 12px; stroke: rgba(255,255,255,0.4);
                     fill: none; stroke-width: 1.8; stroke-linecap: round; }
      .atb-item:hover .atb-ico svg { stroke: rgba(255,255,255,0.75); }
      .atb-sep { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 2px; }
      .atb-sec { font-size: 10px; color: rgba(255,255,255,0.22);
                 letter-spacing: 0.1em; text-transform: uppercase;
                 padding: 8px 10px 4px; }

      /* Window controls */
      .atb-ctrls { display: flex; align-items: center; height: 100%;
                   -webkit-app-region: no-drag; }
      .atb-ctrl {
        width: 46px; height: 100%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; border: none; background: transparent;
        color: rgba(255,255,255,0.5);
        transition: background .12s, color .12s;
        -webkit-app-region: no-drag;
      }
      .atb-ctrl:hover { background: rgba(255,255,255,0.08);
                        color: rgba(255,255,255,0.95); }
      .atb-ctrl.atb-x:hover { background: #c42b1c; color: #fff; }
      .atb-ctrl svg { width: 10px; height: 10px; stroke: currentColor; fill: none;
                      stroke-width: 1.3; stroke-linecap: round; pointer-events: none; }

      /* Push page content below title bar */
      body.__axm_pad { padding-top: ${TB_H}px !important; }
    `;
    document.head.appendChild(style);

    // ── HTML ─────────────────────────────────────────────────────────────────
    const tb = document.createElement('div');
    tb.id = '__axm_tb';
    tb.innerHTML = `
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

      <div class="atb-menus">
        <div class="atb-mb" data-menu="file">File
          <div class="atb-dd">
            <div class="atb-item" data-action="reload">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
              <span class="atb-lbl">Reload</span><span class="atb-kbd">Ctrl+R</span>
            </div>
            <div class="atb-sep"></div>
            <div class="atb-item" data-action="close">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span class="atb-lbl">Quit AxiomPips</span><span class="atb-kbd">Ctrl+Q</span>
            </div>
          </div>
        </div>

        <div class="atb-mb" data-menu="view">View
          <div class="atb-dd">
            <div class="atb-sec">Zoom</div>
            <div class="atb-item" data-action="zoom-in">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></span>
              <span class="atb-lbl">Zoom In</span><span class="atb-kbd">Ctrl++</span>
            </div>
            <div class="atb-item" data-action="zoom-out">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></span>
              <span class="atb-lbl">Zoom Out</span><span class="atb-kbd">Ctrl+−</span>
            </div>
            <div class="atb-item" data-action="zoom-reset">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <span class="atb-lbl">Reset Zoom</span><span class="atb-kbd">Ctrl+0</span>
            </div>
            <div class="atb-sep"></div>
            <div class="atb-sec">Developer</div>
            <div class="atb-item" data-action="devtools">
              <span class="atb-ico"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span>
              <span class="atb-lbl">Developer Tools</span><span class="atb-kbd">F12</span>
            </div>
          </div>
        </div>

        <div class="atb-mb" data-menu="about">About
          <div class="atb-dd">
            <div class="atb-item atb-dis" id="__atb_ver">
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
      </div>

      <div class="atb-drag"></div>

      <div class="atb-ctrls">
        <button class="atb-ctrl atb-min" title="Minimize">
          <svg viewBox="0 0 10 1"><line x1="0" y1="0.5" x2="10" y2="0.5"/></svg>
        </button>
        <button class="atb-ctrl atb-max" id="__atb_max" title="Maximize">
          <svg viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" rx="0.5"/></svg>
        </button>
        <button class="atb-ctrl atb-x" title="Close">
          <svg viewBox="0 0 10 10">
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5"/>
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5"/>
          </svg>
        </button>
      </div>
    `;

    document.body.prepend(tb);
    document.body.classList.add('__axm_pad');

    // Populate version
    ipcRenderer.invoke('app-version')
      .then(v => {
        const el = document.getElementById('__atb_ver');
        if (el) el.querySelector('.atb-lbl').textContent = `AxiomPips v${v}`;
      })
      .catch(() => {});

    // ── Dropdown logic ────────────────────────────────────────────────────────
    function closeAll() {
      tb.querySelectorAll('.atb-mb.atb-open')
        .forEach(b => b.classList.remove('atb-open'));
    }

    tb.querySelectorAll('.atb-mb').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = btn.classList.contains('atb-open');
        closeAll();
        if (!wasOpen) btn.classList.add('atb-open');
      });
      btn.addEventListener('mouseenter', () => {
        if (tb.querySelector('.atb-mb.atb-open') &&
            !btn.classList.contains('atb-open')) {
          closeAll();
          btn.classList.add('atb-open');
        }
      });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });

    // ── Item actions ──────────────────────────────────────────────────────────
    tb.querySelectorAll('.atb-item[data-action]').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        closeAll();
        const a = item.dataset.action;
        try {
          if      (a === 'reload')       ipcRenderer.invoke('reload-app');
          else if (a === 'close')        ipcRenderer.invoke('window-close');
          else if (a === 'zoom-in')      ipcRenderer.invoke('zoom',  +0.1);
          else if (a === 'zoom-out')     ipcRenderer.invoke('zoom',  -0.1);
          else if (a === 'zoom-reset')   ipcRenderer.invoke('zoom',   0);
          else if (a === 'devtools')     ipcRenderer.invoke('toggle-devtools');
          else if (a === 'open-browser') ipcRenderer.invoke('open-in-browser');
        } catch (err) { console.warn('[titlebar] action error:', err); }
      });
    });

    // ── Window controls ───────────────────────────────────────────────────────
    tb.querySelector('.atb-min')
      .addEventListener('click', () => ipcRenderer.invoke('window-minimize'));
    tb.querySelector('.atb-max')
      .addEventListener('click', () => ipcRenderer.invoke('window-maximize'));
    tb.querySelector('.atb-x')
      .addEventListener('click', () => ipcRenderer.invoke('window-close'));

    // Swap maximize ↔ restore icon
    try {
      ipcRenderer.on('window-state', (_, maximized) => {
        try {
          const btn = document.getElementById('__atb_max');
          if (!btn) return;
          btn.title = maximized ? 'Restore' : 'Maximize';
          btn.querySelector('svg').innerHTML = maximized
            ? '<path d="M1 4h5v5H1zM4 1h5v5H4" stroke="currentColor" fill="none"/>'
            : '<rect x="0.5" y="0.5" width="9" height="9" rx="0.5"/>';
        } catch (_) {}
      });
    } catch (_) {}

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
      try {
        if (e.ctrlKey && e.key === 'r') { e.preventDefault(); ipcRenderer.invoke('reload-app'); }
        if (e.ctrlKey && e.key === 'q') { e.preventDefault(); ipcRenderer.invoke('window-close'); }
        if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
          e.preventDefault(); ipcRenderer.invoke('zoom', +0.1);
        }
        if (e.ctrlKey && e.key === '-') { e.preventDefault(); ipcRenderer.invoke('zoom', -0.1); }
        if (e.ctrlKey && e.key === '0') { e.preventDefault(); ipcRenderer.invoke('zoom', 0); }
        if (e.key === 'F12') { e.preventDefault(); ipcRenderer.invoke('toggle-devtools'); }
      } catch (_) {}
    }, true); // capture phase — intercept before page handlers

  } catch (err) {
    // Title bar injection failed — log but do not re-throw.
    // The main window still shows the website correctly without the custom bar.
    console.warn('[preload] title bar injection failed:', err.message);
  }
}

// ── Inject title bar when DOM is ready ────────────────────────────────────────

function tryInject() {
  if (document.body) {
    buildTitleBar();
  } else {
    // Body not ready yet — retry once after a short delay
    setTimeout(() => {
      try { buildTitleBar(); } catch (_) {}
    }, 50);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInject);
} else {
  tryInject();
}
