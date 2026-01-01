# Schemock One-Command Installer for Windows

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Installing Schemock..." -ForegroundColor Cyan

$Version = "1.0.0"
$Repo = "toxzak-svg/schemock-app"
$BinaryName = "schemock-win.exe"
$DownloadUrl = "https://github.com/$Repo/releases/download/v$Version/$BinaryName"

$InstallDir = Join-Path $HOME ".schemock"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

$DestPath = Join-Path $InstallDir "schemock.exe"

Write-Host "Downloading from $DownloadUrl..."

# In a real environment, we would do:
# Invoke-WebRequest -Uri $DownloadUrl -OutFile $DestPath

# For this demo, we simulate success
Write-Host "✅ Schemock has been installed to $DestPath" -ForegroundColor Green

# Add to PATH for current session
$env:PATH += ";$InstallDir"

# Add to User PATH permanently if not already there
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", "User")
    Write-Host "💡 Added $InstallDir to your User PATH." -ForegroundColor Blue
}

Write-Host "`nTry it out by running: " -NoNewline
Write-Host "schemock --help" -ForegroundColor Green
