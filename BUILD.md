# Schemock Build Documentation

Complete guide for building Schemock distribution packages.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Scripts](#build-scripts)
- [Distribution Packages](#distribution-packages)
- [Build Process](#build-process)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Advanced](#advanced)

## Overview

Schemock uses a comprehensive build system that creates multiple distribution packages:

1. **Base Release Package** - Core executable and files
2. **NSIS Installer** - Professional Windows installer (Schemock-Setup.exe)
3. **Portable Package** - Self-contained ZIP package (schemock-portable.zip)
4. **Checksums & Verification** - SHA-256 checksums for all packages

### Build Architecture

```
Build System
├── scripts/build.js              → Base release (executable + docs)
├── scripts/build-installer.js    → NSIS installer
├── scripts/build-portable.js     → Portable ZIP package
├── scripts/build-distribution.js → Master orchestration script
└── scripts/installer.nsi         → NSIS configuration
```

## Prerequisites

### Required Software

1. **Node.js** (v18 or later)
   ```powershell
   node --version  # Should be v18.0.0 or higher
   ```

2. **npm** (comes with Node.js)
   ```powershell
   npm --version
   ```

3. **Git** (for version control)
   ```powershell
   git --version
   ```

### Required npm Packages

All required packages are in `package.json`. Install with:

```powershell
npm install
```

Key build dependencies:
- `pkg` - Creates standalone executables
- `archiver` - Creates ZIP archives
- `typescript` - TypeScript compiler
- `jest` - Testing framework

### Optional Software

1. **NSIS (Nullsoft Scriptable Install System)**
   - Required for building Windows installer
   - Download: https://nsis.sourceforge.io/
   - Or install via Chocolatey:
     ```powershell
     choco install nsis
     ```
   
2. **Windows SDK** (for code signing)
   - Required only if you want to digitally sign executables
   - Download: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

### System Requirements

- **OS**: Windows 10 or later (x64)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk**: 2GB free space for builds
- **PowerShell**: 5.1 or later

## Quick Start

### Build Everything (Recommended)

This single command builds all distribution packages:

```powershell
npm run build:distribution
```

This will:
1. Clean previous builds
2. Build base release package
3. Build NSIS installer (if NSIS is installed)
4. Build portable ZIP package
5. Calculate checksums
6. Create distribution directory
7. Generate build reports

### Individual Builds

Build specific components:

```powershell
# Just the base release
npm run build:release

# Just the installer (requires NSIS)
npm run build:installer

# Just the portable package
npm run build:portable
```

### Development Build

For development and testing:

```powershell
# Build TypeScript only
npm run build

# Build executable
npm run build:exe

# Run tests
npm test
```

## Build Scripts

### npm run build

**Purpose**: Compile TypeScript to JavaScript

**Output**: `dist/` directory with compiled JavaScript

**Duration**: ~10-30 seconds

**Usage**:
```powershell
npm run build
```

### npm run build:exe

**Purpose**: Create standalone Windows executable

**Output**: `dist/executable/schemock.exe`

**Duration**: ~2-5 minutes

**Usage**:
```powershell
npm run build:exe
```

**Details**:
- Uses `pkg` to bundle Node.js runtime
- Creates 64-bit Windows executable
- Bundles all dependencies
- No Node.js required on target machine

### npm run build:release

**Purpose**: Create base release package

**Output**: 
- `releases/schemock-1.0.0/` directory
- Contains: executable, docs, examples, batch files

**Duration**: ~3-7 minutes

**Usage**:
```powershell
npm run build:release
```

**Contents**:
```
releases/schemock-1.0.0/
├── schemock.exe          # Standalone executable
├── README.md             # Quick start guide
├── version.json          # Version information
├── build-report.json     # Build metadata
├── start.bat             # Quick launch script
├── help.bat              # Help launcher
├── docs/                 # Documentation
│   ├── user-guide.md
│   ├── api-documentation.md
│   └── troubleshooting.md
└── examples/             # Example schemas
    ├── simple-user.json
    └── ecommerce-product.json
```

### npm run build:installer

**Purpose**: Create professional NSIS installer

**Output**: `releases/Schemock-Setup.exe`

**Duration**: ~1-3 minutes

**Requirements**: NSIS must be installed

**Usage**:
```powershell
npm run build:installer
```

**Installer Features**:
- ✅ Professional installation wizard
- ✅ Start Menu shortcuts
- ✅ Desktop shortcut (optional)
- ✅ Add to system PATH (optional)
- ✅ File association for .schemock.json (optional)
- ✅ Silent installation support: `Schemock-Setup.exe /S`
- ✅ Silent uninstallation support
- ✅ Version checking and upgrade handling
- ✅ Proper uninstaller
- ✅ Registry cleanup on uninstall

**Installation Options**:
```powershell
# Standard installation (GUI wizard)
.\Schemock-Setup.exe

# Silent installation
.\Schemock-Setup.exe /S

# Silent installation to custom directory
.\Schemock-Setup.exe /S /D=C:\MyPrograms\Schemock

# Silent uninstallation
"C:\Program Files\Schemock\Uninstall.exe" /S
```

### npm run build:portable

**Purpose**: Create portable ZIP package

**Output**: `releases/schemock-1.0.0-portable.zip`

**Duration**: ~1-2 minutes

**Usage**:
```powershell
npm run build:portable
```

**Portable Package Features**:
- ✅ No installation required
- ✅ Runs from any location (USB, network drive, etc.)
- ✅ No system modifications (registry, PATH, etc.)
- ✅ No administrator rights required
- ✅ Multiple instance support
- ✅ Relative path handling
- ✅ Local data/log storage
- ✅ Batch and PowerShell launchers included

**Package Contents**:
```
schemock-portable/
├── schemock.exe              # Main executable
├── schemock-portable.bat     # Batch launcher (recommended)
├── schemock-portable.ps1     # PowerShell launcher
├── quick-start.bat           # Quick demo launcher
├── README.md                 # Portable usage guide
├── config.example.json       # Configuration template
├── checksums.json            # File checksums
├── version.json              # Version info
├── docs/                     # Documentation
├── examples/                 # Example schemas
├── data/                     # Data directory (created at runtime)
├── logs/                     # Log files (created at runtime)
└── temp/                     # Temporary files (created at runtime)
```

### npm run build:distribution

**Purpose**: Build all distribution packages

**Output**: 
- Complete distribution in `releases/distribution-1.0.0/`
- All packages with checksums and reports

**Duration**: ~5-15 minutes

**Usage**:
```powershell
npm run build:distribution
```

**Process**:
1. Clean all previous builds
2. Run tests
3. Build base release
4. Build NSIS installer (if available)
5. Build portable package
6. Calculate SHA-256 checksums
7. Create distribution directory
8. Generate build reports

**Output Structure**:
```
releases/distribution-1.0.0/
├── Schemock-Setup.exe                  # Installer
├── schemock-1.0.0-portable.zip         # Portable package
├── schemock-1.0.0/                     # Base package
├── checksums-1.0.0.json                # Checksums (JSON)
├── SHA256SUMS.txt                      # Checksums (text)
├── BUILD-REPORT.json                   # Detailed build report
├── BUILD-SUMMARY.txt                   # Human-readable summary
└── portable-build-report-1.0.0.json    # Portable build details
```

## Distribution Packages

### Package Comparison

| Feature | Installer | Portable |
|---------|-----------|----------|
| Installation Required | Yes | No |
| System Modifications | Yes (registry, PATH) | No |
| Admin Rights | Yes (for system-wide) | No |
| Auto-updates | Possible | Manual |
| Start Menu | Yes | No |
| PATH Integration | Optional | No |
| File Associations | Optional | No |
| USB Compatible | No | Yes |
| Multiple Instances | No | Yes |
| Uninstall | Via Control Panel | Delete folder |
| Size | ~30-50 MB | ~25-40 MB |
| Best For | End users | Developers, portable use |

### When to Use Each Package

**Use Installer When**:
- Installing for non-technical users
- Want system-wide installation
- Need Start Menu integration
- Want file associations
- Prefer standard Windows installation experience

**Use Portable When**:
- Testing/development
- No admin rights available
- Need to run from USB/network drive
- Want multiple versions simultaneously
- Prefer no system modifications
- Quick deployment without installation

## Build Process

### Complete Build Workflow

```powershell
# 1. Clean workspace
npm run clean

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build distribution
npm run build:distribution

# 5. Verify outputs
dir releases\distribution-1.0.0
```

### Build Phases

#### Phase 1: Preparation
- Clean previous builds
- Install/verify dependencies
- Run tests
- Verify TypeScript compilation

#### Phase 2: Base Package
- Compile TypeScript (`tsc`)
- Create executable (`pkg`)
- Copy documentation
- Copy examples
- Create batch helpers
- Generate version info
- Create build report

#### Phase 3: Installer (Optional)
- Check NSIS availability
- Prepare files for installer
- Compile NSIS script
- Generate installer executable
- Calculate installer checksum

#### Phase 4: Portable Package
- Create directory structure
- Copy executable and files
- Create portable launchers
- Generate portable README
- Create ZIP archive
- Calculate checksums

#### Phase 5: Distribution
- Calculate all checksums
- Copy packages to distribution folder
- Generate build reports
- Create verification files

### Build Outputs

All build outputs go to the `releases/` directory:

```
releases/
├── schemock-1.0.0/                   # Base package
├── Schemock-Setup.exe                # Installer
├── schemock-1.0.0-portable.zip       # Portable package
├── distribution-1.0.0/               # Complete distribution
├── checksums-1.0.0.json              # Checksums
├── SHA256SUMS.txt                    # Checksums (standard format)
└── *.json                            # Various build reports
```

## Testing

### Pre-Build Testing

Always run tests before building:

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm test -- --coverage
```

### Post-Build Testing

#### Test Base Executable

```powershell
cd dist\executable
.\schemock.exe --version
.\schemock.exe --help
.\schemock.exe start ..\..\examples\simple-user.json
```

#### Test Installer

**Clean System Test** (Recommended):
1. Use a virtual machine or clean Windows installation
2. Run installer: `Schemock-Setup.exe`
3. Verify installation in Program Files
4. Check Start Menu shortcuts
5. Test executable from command line
6. Test uninstaller

**Silent Installation Test**:
```powershell
# Install silently
.\Schemock-Setup.exe /S

# Wait for installation
Start-Sleep -Seconds 10

# Verify installation
Test-Path "C:\Program Files\Schemock\schemock.exe"

# Test executable
& "C:\Program Files\Schemock\schemock.exe" --version

# Uninstall silently
& "C:\Program Files\Schemock\Uninstall.exe" /S
```

#### Test Portable Package

```powershell
# Extract to test location
Expand-Archive -Path "releases\schemock-1.0.0-portable.zip" -DestinationPath "C:\temp\schemock-test"

# Test batch launcher
cd C:\temp\schemock-test
.\schemock-portable.bat --help
.\quick-start.bat

# Test PowerShell launcher
.\schemock-portable.ps1 start examples\simple-user.json

# Test portability (move folder and try again)
Move-Item "C:\temp\schemock-test" "D:\portable-test"
cd D:\portable-test
.\schemock-portable.bat --help
```

#### Verify Checksums

```powershell
# Verify using PowerShell
$file = "releases\Schemock-Setup.exe"
$hash = Get-FileHash $file -Algorithm SHA256
$expected = (Get-Content "releases\checksums-1.0.0.json" | ConvertFrom-Json).files."Schemock-Setup.exe".sha256

if ($hash.Hash -eq $expected) {
    Write-Host "✅ Checksum verified!" -ForegroundColor Green
} else {
    Write-Host "❌ Checksum mismatch!" -ForegroundColor Red
}

# Or use certutil
certutil -hashfile "releases\Schemock-Setup.exe" SHA256
```

### Testing Checklist

- [ ] All tests pass (`npm test`)
- [ ] Executable runs (`schemock.exe --version`)
- [ ] Installer installs successfully
- [ ] Installer creates shortcuts
- [ ] Installer adds to PATH (if selected)
- [ ] Uninstaller removes all files
- [ ] Uninstaller cleans registry
- [ ] Portable package runs from USB drive
- [ ] Portable package runs without admin rights
- [ ] All examples work
- [ ] Health check endpoint works
- [ ] POST requests work
- [ ] Watch mode works
- [ ] Checksums match
- [ ] Documentation is included

## Troubleshooting

### Common Build Errors

#### "NSIS not found"

**Problem**: Installer build fails because NSIS is not installed.

**Solution**:
```powershell
# Install NSIS via Chocolatey
choco install nsis

# Or download from https://nsis.sourceforge.io/

# Verify installation
makensis -version
```

#### "pkg not found"

**Problem**: `pkg` command fails.

**Solution**:
```powershell
# Reinstall dependencies
npm install

# Or install pkg globally
npm install -g pkg
```

#### "Tests failed"

**Problem**: Build stops because tests are failing.

**Solution**:
```powershell
# Run tests to see which ones are failing
npm test

# Fix the failing tests, then rebuild
npm run build:distribution
```

#### "Module not found"

**Problem**: Build fails with missing module error.

**Solution**:
```powershell
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build:distribution
```

#### "Access denied"

**Problem**: Cannot write to directories.

**Solution**:
```powershell
# Run as administrator
# Or clean old builds first
npm run clean
npm run build:distribution
```

### Build Performance Issues

#### Slow pkg Build

The `pkg` step can take 2-5 minutes. This is normal.

To speed up:
```powershell
# Skip tests during development builds
npm run build:exe
# Instead of
npm run build:distribution
```

#### Large Executable Size

Executables are 40-60 MB because they include Node.js runtime.

This is expected and cannot be significantly reduced.

#### Slow ZIP Compression

Portable ZIP uses maximum compression (level 9).

For faster builds during development:
- Edit `scripts/build-portable.js`
- Change `zlib: { level: 9 }` to `zlib: { level: 6 }`

## Advanced

### Custom Build Configuration

#### Change Version Number

Edit `package.json`:
```json
{
  "version": "1.1.0"
}
```

All build scripts read version from `package.json`.

#### Customize Installer

Edit `scripts/installer.nsi`:
- Company name
- Website URL
- Installation directory
- Shortcuts
- Registry keys
- File associations

#### Customize Portable Package

Edit `scripts/build-portable.js`:
- Directory structure
- Launcher scripts
- Configuration files
- Environment variables

### Build Automation

#### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Distribution

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install NSIS
        run: choco install nsis -y
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build distribution
        run: npm run build:distribution
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: distribution
          path: releases/distribution-*/*
```

### Digital Signing

To digitally sign the executable and installer:

1. **Obtain Code Signing Certificate**
   - Purchase from a Certificate Authority
   - Or use self-signed for testing

2. **Sign Executable**
   ```powershell
   # Using signtool from Windows SDK
   signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "releases\schemock-1.0.0\schemock.exe"
   ```

3. **Sign Installer**
   ```powershell
   signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "releases\Schemock-Setup.exe"
   ```

4. **Verify Signature**
   ```powershell
   signtool verify /pa "releases\Schemock-Setup.exe"
   ```

### Creating Release Notes

Automatically generate release notes:

```powershell
# Create release notes from git log
git log --pretty=format:"- %s" v1.0.0..HEAD > RELEASE-NOTES.md
```

### Build Metrics

Track build metrics:

```powershell
# Build time
Measure-Command { npm run build:distribution }

# Output sizes
Get-ChildItem releases\distribution-1.0.0 -Recurse | Measure-Object -Property Length -Sum

# Test coverage
npm test -- --coverage
```

## Support

### Documentation

- **User Guide**: [docs/user-guide.md](docs/user-guide.md)
- **Deployment Guide**: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

### Getting Help

- **GitHub Issues**: https://github.com/toxzak-svg/schemock-app/issues
- **Discussions**: https://github.com/toxzak-svg/schemock-app/discussions

---

**Last Updated**: December 2025  
**Build System Version**: 1.0.0
