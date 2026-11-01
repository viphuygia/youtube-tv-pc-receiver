; Inno Setup Script for YouTube TV Receiver for Windows
; Produces a standalone, single-file setup executable

#define MyAppName "YouTube TV Receiver"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "viphuygia"
#define MyAppURL "https://github.com/viphuygia/youtube-tv-pc-receiver"
#define MyAppExeName "YouTubeTV.exe"

[Setup]
AppId={{8B4F942C-38D1-4E1B-94A5-E18252C32D77}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=dist-installer
OutputBaseFilename=YouTube-TV-Receiver-Setup-v1.2.0
SetupIconFile=resources\app.ico
UninstallDisplayIcon={app}\resources\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
DisableWelcomePage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a Desktop shortcut (Tạo biểu tượng ngoài màn hình)"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Launch automatically on Windows startup (Tự động khởi động cùng Windows)"; GroupDescription: "Startup options:"

[Files]
Source: "build-staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\app.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\app.ico"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "YouTubeTVReceiver"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
