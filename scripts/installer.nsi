; Schemock Installer Script
; Written for NSIS 3.0+
; Professional installer with full feature set

!define PRODUCT_NAME "Schemock"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Schemock Team"
!define PRODUCT_WEB_SITE "https://github.com/toxzak-svg/schemock-app"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define PRODUCT_DIR_REGKEY "Software\${PRODUCT_PUBLISHER}\${PRODUCT_NAME}"
!define PRODUCT_STARTMENU_REGVAL "NSIS:StartMenuDir"

;--------------------------------
;Include Modern UI and required libraries

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "x64.nsh"

;--------------------------------
;General

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Schemock-Setup.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey "${PRODUCT_UNINST_ROOT_KEY}" "${PRODUCT_UNINST_KEY}" "InstallLocation"
ShowInstDetails show
ShowUnInstDetails show

; Request application privileges
RequestExecutionLevel admin

; Branding
BrandingText "${PRODUCT_NAME} v${PRODUCT_VERSION} - ${PRODUCT_PUBLISHER}"

; Compression settings
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; Version information
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "Copyright (c) 2025 ${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Mock Server Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"

;--------------------------------
;Interface Settings

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Header\nsis.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis.bmp"

; Finish page options
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN "$INSTDIR\schemock.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Schemock now"
!define MUI_FINISHPAGE_RUN_PARAMETERS "--help"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.md"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "View README file"
!define MUI_FINISHPAGE_LINK "Visit the Schemock website"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB_SITE}"

;--------------------------------
;Pages

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Functions

Function .onInit
  ; Check for 64-bit Windows
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "This application requires 64-bit Windows."
    Abort
  ${EndIf}
  
  ; Check Windows version (Windows 10 or later)
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONEXCLAMATION "This application requires Windows 10 or later."
    Abort
  ${EndIf}
  
  ; Check if already installed
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "${PRODUCT_NAME} is already installed.$\n$\nClick OK to uninstall the previous version first, or Cancel to cancel this installation." \
    IDOK uninst
  Abort
  
uninst:
  ; Run the uninstaller
  ClearErrors
  ExecWait '$R0 /S _?=$INSTDIR'
  
done:
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 \
    "Are you sure you want to completely remove ${PRODUCT_NAME} and all of its components?" \
    IDYES +2
  Abort
FunctionEnd

;--------------------------------
;Installer Sections

Section "!Core Files (Required)" SecCore
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Main executable
  File "releases\schemock-1.0.0\schemock.exe"
  
  ; Documentation
  SetOutPath "$INSTDIR\docs"
  File /nonfatal /r "releases\schemock-1.0.0\docs\*.*"
  
  ; Examples
  SetOutPath "$INSTDIR\examples"
  File /nonfatal /r "releases\schemock-1.0.0\examples\*.*"
  
  ; Support files
  SetOutPath "$INSTDIR"
  File /nonfatal "releases\schemock-1.0.0\README.md"
  File /nonfatal "releases\schemock-1.0.0\version.json"
  File /nonfatal "releases\schemock-1.0.0\build-report.json"
  
  ; Batch helpers
  File /nonfatal "releases\schemock-1.0.0\start.bat"
  File /nonfatal "releases\schemock-1.0.0\help.bat"
  
  ; Store installation folder
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" "InstallDir" "$INSTDIR"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" "Version" "${PRODUCT_VERSION}"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Register uninstall information
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "QuietUninstallString" "$\"$INSTDIR\Uninstall.exe$\" /S"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1
  
  ; Get and store the size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"
SectionEnd

Section "Start Menu Shortcuts" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" \
    "$INSTDIR\schemock.exe" "" "$INSTDIR\schemock.exe" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Help.lnk" \
    "$INSTDIR\schemock.exe" "--help" "$INSTDIR\schemock.exe" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Documentation.lnk" \
    "$INSTDIR\docs\user-guide.md" "" "" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Examples.lnk" \
    "$INSTDIR\examples" "" "" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" \
    "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" \
    "$INSTDIR\schemock.exe" "" "$INSTDIR\schemock.exe" 0
SectionEnd

Section "Add to System PATH" SecPath
  ; Add to system PATH for command-line access
  Push $INSTDIR
  Call AddToPath
  
  ; Create registry entry for PATH modification tracking
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" "AddedToPath" "1"
SectionEnd

Section /o "Create File Association (.json)" SecFileAssoc
  ; Associate .json files with schemock
  WriteRegStr HKCR ".schemock.json" "" "SchemockSchema"
  WriteRegStr HKCR "SchemockSchema" "" "Schemock Schema File"
  WriteRegStr HKCR "SchemockSchema\DefaultIcon" "" "$INSTDIR\schemock.exe,0"
  WriteRegStr HKCR "SchemockSchema\shell\open\command" "" '"$INSTDIR\schemock.exe" start "%1"'
  
  ; Notify Windows of file association change
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
SectionEnd

;--------------------------------
;Descriptions

LangString DESC_SecCore ${LANG_ENGLISH} "Core application files and documentation (required)"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Create Start Menu shortcuts for easy access"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create a Desktop shortcut"
LangString DESC_SecPath ${LANG_ENGLISH} "Add Schemock to Windows PATH for command-line access"
LangString DESC_SecFileAssoc ${LANG_ENGLISH} "Associate .schemock.json files with Schemock"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} $(DESC_SecCore)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} $(DESC_SecStartMenu)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecPath} $(DESC_SecPath)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecFileAssoc} $(DESC_SecFileAssoc)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
;Uninstaller Section

Section "Uninstall"
  
  ; Remove file association
  DeleteRegKey HKCR ".schemock.json"
  DeleteRegKey HKCR "SchemockSchema"
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  
  ; Remove files and folders
  Delete "$INSTDIR\schemock.exe"
  Delete "$INSTDIR\start.bat"
  Delete "$INSTDIR\help.bat"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\version.json"
  Delete "$INSTDIR\build-report.json"
  Delete "$INSTDIR\Uninstall.exe"
  
  RMDir /r "$INSTDIR\docs"
  RMDir /r "$INSTDIR\examples"
  
  ; Try to remove install directory (will fail if not empty)
  RMDir "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove from PATH if it was added
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" "AddedToPath"
  ${If} $R0 == "1"
    Push $INSTDIR
    Call un.RemoveFromPath
  ${EndIf}
  
  ; Remove registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}"
  
  SetAutoClose true
SectionEnd

;--------------------------------
;Functions for PATH manipulation

Function AddToPath
  Exch $0
  Push $1
  Push $2
  Push $3
  
  ; Try HKLM first (system-wide PATH)
  ReadRegStr $1 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  ${If} $1 == ""
    ; Fall back to HKCU (user PATH)
    ReadRegStr $1 HKCU "Environment" "Path"
    StrCpy $2 "HKCU"
  ${Else}
    StrCpy $2 "HKLM"
  ${EndIf}
  
  ; Check if already in PATH
  Push "$1;"
  Push "$0;"
  Call StrStr
  Pop $3
  ${If} $3 == ""
    ; Not in PATH, add it
    ${If} $1 != ""
      StrCpy $1 "$1;$0"
    ${Else}
      StrCpy $1 "$0"
    ${EndIf}
    
    ${If} $2 == "HKLM"
      WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" $1
    ${Else}
      WriteRegExpandStr HKCU "Environment" "Path" $1
    ${EndIf}
    
    ; Broadcast WM_SETTINGCHANGE to update environment
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  ${EndIf}
  
  Pop $3
  Pop $2
  Pop $1
  Pop $0
FunctionEnd

Function un.RemoveFromPath
  Exch $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5
  
  ; Try HKLM first
  ReadRegStr $1 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  ${If} $1 == ""
    ReadRegStr $1 HKCU "Environment" "Path"
    StrCpy $5 "HKCU"
  ${Else}
    StrCpy $5 "HKLM"
  ${EndIf}
  
  StrCpy $2 $1 1 -1
  ${If} $2 == ";"
    StrCpy $1 $1 -1
  ${EndIf}
  
  Push $1
  Push "$0;"
  Call un.StrStr
  Pop $3
  ${If} $3 != ""
    StrLen $4 "$0;"
    StrCpy $2 $3 "" $4
    StrLen $4 $3
    StrCpy $1 $1 -$4
    StrCpy $1 "$1$2"
  ${EndIf}
  
  ${If} $5 == "HKLM"
    WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" $1
  ${Else}
    WriteRegExpandStr HKCU "Environment" "Path" $1
  ${EndIf}
  
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
FunctionEnd

; String search function
Function StrStr
  Exch $R1
  Exch
  Exch $R2
  Push $R3
  Push $R4
  Push $R5
  
  StrLen $R3 $R1
  StrCpy $R4 0
  
  loop:
    StrCpy $R5 $R2 $R3 $R4
    ${If} $R5 == $R1
      StrCpy $R1 $R2 $R4
      Goto done
    ${EndIf}
    ${If} $R5 == ""
      StrCpy $R1 ""
      Goto done
    ${EndIf}
    IntOp $R4 $R4 + 1
    Goto loop
  
  done:
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Exch $R1
FunctionEnd

Function un.StrStr
  Exch $R1
  Exch
  Exch $R2
  Push $R3
  Push $R4
  Push $R5
  
  StrLen $R3 $R1
  StrCpy $R4 0
  
  loop:
    StrCpy $R5 $R2 $R3 $R4
    ${If} $R5 == $R1
      StrCpy $R1 $R2 $R4
      Goto done
    ${EndIf}
    ${If} $R5 == ""
      StrCpy $R1 ""
      Goto done
    ${EndIf}
    IntOp $R4 $R4 + 1
    Goto loop
  
  done:
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Exch $R1
FunctionEnd