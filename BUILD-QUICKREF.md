# Schemock Build System - Quick Reference

## 🚀 Quick Commands

```powershell
# Build everything (recommended)
npm run build:distribution

# Verify checksums
npm run verify:checksums

# Test distribution
.\test-distribution.ps1

# Individual builds
npm run build:release        # Base package only
npm run build:installer      # Installer only (requires NSIS)
npm run build:portable       # Portable ZIP only
```

## 📦 What Gets Built

### 1. Installer Package (`Schemock-Setup.exe`)
- Professional Windows installer with wizard
- Size: ~30-50 MB
- Features: Start Menu, Desktop shortcut, PATH integration, File associations
- Silent install: `Schemock-Setup.exe /S`

### 2. Portable Package (`schemock-1.0.0-portable.zip`)
- No installation required
- Size: ~25-40 MB
- Features: USB compatible, no system changes, multiple instances
- Run: Extract and use `schemock-portable.bat`

### 3. Checksums & Reports
- `SHA256SUMS.txt` - Standard checksum file
- `checksums-1.0.0.json` - Detailed checksums
- `BUILD-REPORT.json` - Complete build metadata
- `BUILD-SUMMARY.txt` - Human-readable summary

## 📁 Output Structure

```
releases/distribution-1.0.0/
├── Schemock-Setup.exe              ← Upload to GitHub
├── schemock-1.0.0-portable.zip     ← Upload to GitHub
├── SHA256SUMS.txt                  ← Upload to GitHub
├── BUILD-SUMMARY.txt               ← Upload to GitHub
├── BUILD-REPORT.json
├── checksums-1.0.0.json
└── schemock-1.0.0/                 ← Base package
```

## ✅ Testing Checklist

```powershell
# 1. Build distribution
npm run build:distribution

# 2. Run automated tests
.\test-distribution.ps1

# 3. Test executable
cd releases\distribution-1.0.0\schemock-1.0.0
.\schemock.exe --version
.\schemock.exe start examples\simple-user.json

# 4. Test portable (extract first)
Expand-Archive releases\distribution-1.0.0\schemock-1.0.0-portable.zip -DestinationPath C:\temp\test
cd C:\temp\test
.\quick-start.bat

# 5. Test installer (on VM or clean system)
.\releases\distribution-1.0.0\Schemock-Setup.exe

# 6. Verify checksums
npm run verify:checksums
```

## 📚 Documentation

- **[BUILD.md](BUILD.md)** - Complete build documentation
- **[BUILD-SYSTEM-IMPLEMENTATION.md](BUILD-SYSTEM-IMPLEMENTATION.md)** - Implementation details
- **[LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md)** - Release checklist

## 🔧 Prerequisites

**Required:**
- Node.js 18+
- npm
- Windows 10+ (64-bit)

**Optional:**
- NSIS (for installer build)
- Windows SDK (for code signing)

Install NSIS:
```powershell
choco install nsis
```

## ⚡ Build Process

1. **Cleans** previous builds
2. **Compiles** TypeScript
3. **Runs** tests
4. **Creates** executable with pkg
5. **Builds** base release package
6. **Builds** NSIS installer (if available)
7. **Builds** portable ZIP package
8. **Calculates** SHA-256 checksums
9. **Generates** build reports
10. **Assembles** distribution package

## 🎯 Common Tasks

### Just build the executable
```powershell
npm run build:exe
```

### Build without installer (no NSIS)
```powershell
npm run build:portable
```

### Verify existing build
```powershell
npm run verify:checksums
.\test-distribution.ps1
```

### Clean everything
```powershell
npm run clean
```

### Rebuild from scratch
```powershell
npm run clean
npm install
npm run build:distribution
```

## 🐛 Troubleshooting

### "NSIS not found"
Install NSIS or skip installer build:
```powershell
choco install nsis
# Or just build portable:
npm run build:portable
```

### "Tests failed"
Fix tests first:
```powershell
npm test
# Then rebuild:
npm run build:distribution
```

### "Checksum mismatch"
Rebuild from clean state:
```powershell
npm run clean
npm run build:distribution
npm run verify:checksums
```

## 🚀 Creating a GitHub Release

1. Build distribution:
   ```powershell
   npm run build:distribution
   ```

2. Test everything:
   ```powershell
   .\test-distribution.ps1 -Verbose
   ```

3. Go to GitHub → Releases → "Create a new release"

4. Upload from `releases/distribution-1.0.0/`:
   - `Schemock-Setup.exe`
   - `schemock-1.0.0-portable.zip`
   - `SHA256SUMS.txt`
   - `BUILD-SUMMARY.txt`

5. Tag: `v1.0.0`
6. Title: `Schemock v1.0.0`
7. Publish!

## 📊 Build Scripts Reference

| Script | Purpose | Duration | Output |
|--------|---------|----------|--------|
| `build:distribution` | Build everything | 5-15 min | Complete distribution |
| `build:release` | Base package | 3-7 min | Base package directory |
| `build:installer` | NSIS installer | 1-3 min | Schemock-Setup.exe |
| `build:portable` | Portable ZIP | 1-2 min | portable.zip |
| `verify:checksums` | Verify integrity | <1 min | Verification report |

## 🔐 Security

All packages include SHA-256 checksums.

**Verify downloads:**
```powershell
certutil -hashfile Schemock-Setup.exe SHA256
# Compare with SHA256SUMS.txt
```

**Automated verification:**
```powershell
npm run verify:checksums
```

## 📞 Support

- **Issues**: https://github.com/toxzak-svg/schemock-app/issues
- **Documentation**: See BUILD.md for detailed info
- **Questions**: Open a GitHub Discussion

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: December 2025
