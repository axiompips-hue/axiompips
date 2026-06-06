; electron/installer.nsh
; AxiomPips Custom NSIS Installer Script
; Dark themed, beautiful, professional installer

; ── Unicode & modern UI ───────────────────────────────────────────────────────
Unicode True
ManifestDPIAware true

; ── MUI2 (Modern UI) ─────────────────────────────────────────────────────────
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

; ── Installer appearance ──────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "Are you sure you want to cancel the AxiomPips installation?"

; Header / banner colors (dark theme via branding)
!define MUI_BGCOLOR          "0D0E11"
!define MUI_TEXTCOLOR        "F4F4F5"

; Welcome page
!define MUI_WELCOMEPAGE_TITLE      "Welcome to AxiomPips"
!define MUI_WELCOMEPAGE_TEXT       "AxiomPips is your precision desktop companion for forex trading.$\r$\n$\r$\nGet instant access to 13+ professional calculators, a trade journal, risk tools, and more — all in one native app.$\r$\n$\r$\nClick Next to continue."
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH

; Finish page
!define MUI_FINISHPAGE_TITLE       "AxiomPips is Ready!"
!define MUI_FINISHPAGE_TEXT        "AxiomPips has been installed successfully.$\r$\n$\r$\nYour precision trading toolkit is ready. Launch it from your desktop shortcut or Start menu.$\r$\n$\r$\nHappy trading!"
!define MUI_FINISHPAGE_RUN         "$INSTDIR\AxiomPips.exe"
!define MUI_FINISHPAGE_RUN_TEXT    "Launch AxiomPips now"
!define MUI_FINISHPAGE_LINK        "Visit axiompips.com"
!define MUI_FINISHPAGE_LINK_LOCATION "https://axiompips.com"

; ── Already installed detection ───────────────────────────────────────────────
!macro customInstall
  ; Check if already installed
  ReadRegStr $0 HKCU "Software\AxiomPips" "InstallPath"
  ${If} $0 != ""
  ${AndIf} ${FileExists} "$0\AxiomPips.exe"
    ; Already installed — ask what to do
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION \
      "AxiomPips is already installed on your computer.$\r$\n$\r$\nWould you like to:$\r$\n$\r$\n  YES  — Update to the latest version$\r$\n  NO   — Uninstall AxiomPips$\r$\n  CANCEL — Abort installation" \
      IDYES do_update \
      IDNO  do_uninstall \
      IDCANCEL do_cancel

    do_uninstall:
      ; Run existing uninstaller silently
      ExecWait '"$0\Uninstall AxiomPips.exe" /S'
      MessageBox MB_OK|MB_ICONINFORMATION "AxiomPips has been uninstalled successfully."
      Quit

    do_cancel:
      Quit

    do_update:
      ; Kill running instance if open
      ExecWait 'taskkill /F /IM AxiomPips.exe'
      Sleep 800
      ; Continue with install (overwrites existing)
  ${EndIf}
!macroend

!macro customUnInstall
  ; Remove registry entry on uninstall
  DeleteRegKey HKCU "Software\AxiomPips"
!macroend

; ── Write install path to registry ───────────────────────────────────────────
!macro customInstallMode
  WriteRegStr HKCU "Software\AxiomPips" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\AxiomPips" "Version"     "${VERSION}"
!macroend
