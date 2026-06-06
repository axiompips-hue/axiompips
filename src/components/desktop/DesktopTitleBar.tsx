// src/components/desktop/DesktopTitleBar.tsx
// A slim desktop-mode indicator bar shown only inside Electron.
// Sits above the website content and gives the app a native feel.

'use client';

import { useEffect, useState } from 'react';
import { Monitor, Wifi, Clock } from 'lucide-react';

export function DesktopTitleBar() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [time, setTime]           = useState('');
  const [version, setVersion]     = useState('');

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.isDesktop) return;

    setIsDesktop(true);

    // Get app version
    api.getVersion?.().then((v: string) => setVersion(v));

    // Live clock
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!isDesktop) return null;

  return (
    <div
      className="
        fixed top-0 left-0 right-0 z-[9999]
        h-[3px]
        pointer-events-none
      "
      style={{
        background: 'linear-gradient(90deg, #06b6d4 0%, #818cf8 50%, #06b6d4 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 4s linear infinite',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
