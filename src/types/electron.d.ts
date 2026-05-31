// src/types/electron.d.ts
// Extends the browser Window interface with types for the Electron preload bridge.
// This file is automatically picked up by TypeScript — no import needed.

interface ElectronAPI {
  /** Always true when running inside Electron */
  readonly isDesktop: true;
  /** Returns the Electron app version string */
  getVersion(): Promise<string>;
  /** Returns 'win32' | 'darwin' | 'linux' */
  getPlatform(): Promise<string>;
  /** Opens a URL in the OS default browser */
  openExternal(url: string): Promise<void>;
}

declare global {
  interface Window {
    /** Present only when the page runs inside the Electron desktop shell */
    electronAPI?: ElectronAPI;
  }
}

export {};
