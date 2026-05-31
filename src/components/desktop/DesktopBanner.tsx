// src/components/desktop/DesktopBanner.tsx
// Popup shown on the website inviting users to download the desktop app.
// - Shown once per session (localStorage key: axiompips_desktop_banner_dismissed)
// - Never shown when already running inside Electron
// - Fully keyboard/screen-reader accessible

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Download, Monitor, Zap, Shield, WifiOff } from 'lucide-react';

// ─── Feature bullet data ────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap,     label: 'Instant launch — no browser needed'   },
  { icon: WifiOff, label: 'Works offline with cached data'        },
  { icon: Shield,  label: 'Your data stays on your machine'       },
  { icon: Monitor, label: 'Native menus & keyboard shortcuts'     },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DesktopBannerProps {
  /** URL that triggers the installer download */
  downloadUrl?: string;
  /** Delay before the popup appears (ms). Default: 3000 */
  delay?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function DesktopBanner({
  downloadUrl = 'https://github.com/your-username/axiompips/releases/latest',
  delay = 3000,
}: DesktopBannerProps) {
  const [visible, setVisible]   = useState(false);
  const [leaving, setLeaving]   = useState(false);
  const closeRef                = useRef<HTMLButtonElement>(null);
  const STORAGE_KEY             = 'axiompips_desktop_banner_dismissed';

  // ── Skip entirely if already in the desktop app ─────────────────────────
  const isDesktop =
    typeof window !== 'undefined' &&
    !!(window as unknown as { electronAPI?: { isDesktop: boolean } }).electronAPI?.isDesktop;

  // ── Show once per browser session ────────────────────────────────────────
  useEffect(() => {
    if (isDesktop) return;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [isDesktop, delay]);

  // ── Focus trap: move focus to close button when banner opens ─────────────
  useEffect(() => {
    if (visible) closeRef.current?.focus();
  }, [visible]);

  // ── Escape key closes banner ──────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dismiss with animation ────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    setLeaving(true);
    sessionStorage?.setItem(STORAGE_KEY, '1');
    setTimeout(() => { setVisible(false); setLeaving(false); }, 350);
  }, []);

  const handleDownload = useCallback(() => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    dismiss();
  }, [downloadUrl, dismiss]);

  if (isDesktop || !visible) return null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          leaving ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
        onClick={dismiss}
      />

      {/* ── Dialog panel ─────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-banner-title"
        aria-describedby="desktop-banner-desc"
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-[min(22rem,calc(100vw-3rem))]
          rounded-2xl border border-zinc-700/60
          bg-neutral-900/95 shadow-2xl shadow-black/60
          backdrop-blur-xl
          transition-all duration-350
          ${leaving
            ? 'translate-y-4 opacity-0 scale-95'
            : 'translate-y-0 opacity-100 scale-100'
          }
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* ── Accent top bar ─────────────────────────────────────────────── */}
        <div
          className="h-1 w-full rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg,#06b6d4,#818cf8,#06b6d4)', backgroundSize:'200% 100%' }}
          aria-hidden="true"
        />

        <div className="p-5">
          {/* ── Header row ─────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {/* App icon placeholder */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-accent-400" aria-hidden="true" />
              </div>
              <div>
                <p
                  id="desktop-banner-title"
                  className="text-sm font-semibold text-zinc-50 leading-tight"
                >
                  Get the Desktop App
                </p>
                <p className="text-xs text-accent-400 font-medium">
                  AxiomPips for Windows &amp; Mac
                </p>
              </div>
            </div>

            <button
              ref={closeRef}
              onClick={dismiss}
              aria-label="Dismiss this banner"
              className="
                flex-shrink-0 p-1.5 rounded-lg
                text-zinc-500 hover:text-zinc-300
                hover:bg-zinc-800 transition-colors duration-150
              "
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* ── Tagline ────────────────────────────────────────────────── */}
          <p
            id="desktop-banner-desc"
            className="text-xs text-zinc-400 leading-relaxed mb-4"
          >
            Supercharge your trading workflow. A native desktop experience built
            for speed, privacy, and focus — all the power of AxiomPips, zero
            browser overhead.
          </p>

          {/* ── Feature list ───────────────────────────────────────────── */}
          <ul className="space-y-1.5 mb-5" aria-label="Desktop app features">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon
                  className="w-3.5 h-3.5 text-accent-400 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs text-zinc-300">{label}</span>
              </li>
            ))}
          </ul>

          {/* ── CTA buttons ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="
                flex items-center justify-center gap-2
                w-full px-4 py-2.5 rounded-xl
                bg-accent-500 hover:bg-accent-400
                text-neutral-950 text-sm font-semibold
                transition-colors duration-150
                focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2
                focus-visible:ring-offset-neutral-900
              "
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download Free — Windows &amp; Mac
            </button>

            <button
              onClick={dismiss}
              className="
                w-full px-4 py-2 rounded-xl
                text-zinc-500 hover:text-zinc-300
                text-xs transition-colors duration-150
              "
            >
              No thanks, I&apos;ll stay in the browser
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
