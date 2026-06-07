; electron/installer.nsh
; AxiomPips — Custom installer logic

!macro customInstall
  ReadRegStr $0 HKCU "Software\AxiomPips" "InstallPath"
  StrCmp $0 "" skip_check 0
  IfFileExists "$0\AxiomPips.exe" 0 skip_check
    MessageBox MB_YESNO|MB_ICONQUESTION "AxiomPips is already installed.$\r$\n$\r$\nClick YES to update.$\r$\nClick NO to uninstall." IDYES skip_check IDNO do_uninstall
    do_uninstall:
      ExecWait '"$0\Uninstall AxiomPips.exe" /S'
      MessageBox MB_OK|MB_ICONINFORMATION "AxiomPips has been uninstalled."
      Quit
  skip_check:
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\AxiomPips"
!macroend

!macro customInstallMode
  WriteRegStr HKCU "Software\AxiomPips" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\AxiomPips" "Version" "${VERSION}"
!macroend
