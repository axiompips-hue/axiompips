; electron/installer.nsh
; AxiomPips — Custom installer logic only (no MUI redefinitions)

!macro customInstall
  ; Check if already installed
  ReadRegStr $0 HKCU "Software\AxiomPips" "InstallPath"
  ${If} $0 != ""
  ${AndIf} ${FileExists} "$0\AxiomPips.exe"
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION \
      "AxiomPips is already installed.$\r$\n$\r$\nYES    = Update to latest version$\r$\nNO     = Uninstall AxiomPips$\r$\nCANCEL = Abort" \
      IDYES done \
      IDNO  do_uninstall \
      IDCANCEL do_cancel

    do_uninstall:
      ExecWait '"$0\Uninstall AxiomPips.exe" /S'
      MessageBox MB_OK|MB_ICONINFORMATION "AxiomPips has been uninstalled."
      Quit

    do_cancel:
      Quit

    done:
      ExecWait 'taskkill /F /IM AxiomPips.exe'
      Sleep 800
  ${EndIf}
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\AxiomPips"
!macroend

!macro customInstallMode
  WriteRegStr HKCU "Software\AxiomPips" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\AxiomPips" "Version" "${VERSION}"
!macroend
