#!/usr/bin/env node

/**
 * Build Portable Package Script
 * Creates a self-contained portable ZIP package for Schemock
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

// Configuration
const config = {
  version: require('../package.json').version,
  productName: 'Schemock',
  releaseDir: 'releases',
  baseReleaseDir: null, // Will be read from .release-path file
  portableDir: null, // Will be set dynamically
  outputZip: null // Will be set dynamically
};

// Read the actual release directory from the path file created by build.js
try {
  const releasePath = fs.readFileSync('.release-path', 'utf8').trim();
  config.baseReleaseDir = releasePath;
  console.log(`📂 Using base release: ${config.baseReleaseDir}`);
} catch (error) {
  // Fallback to default path
  config.baseReleaseDir = path.join(config.releaseDir, `schemock-${config.version}`);
  console.log(`⚠️  Could not read .release-path, using default: ${config.baseReleaseDir}`);
}

// Set dynamic paths
config.portableDir = path.join(config.releaseDir, `schemock-${config.version}-portable`);
config.outputZip = path.join(config.releaseDir, `schemock-${config.version}-portable.zip`);

console.log('📱 Building Schemock Portable Package');
console.log(`📦 Version: ${config.version}`);
console.log('');

/**
 * Clean previous portable builds
 */
function cleanPortable() {
  console.log('🧹 Cleaning previous portable builds...');
  
  try {
    if (fs.existsSync(config.portableDir)) {
      fs.rmSync(config.portableDir, { recursive: true, force: true });
      console.log(`  ✅ Removed ${config.portableDir}`);
    }
    
    if (fs.existsSync(config.outputZip)) {
      fs.unlinkSync(config.outputZip);
      console.log(`  ✅ Removed ${config.outputZip}`);
    }
    
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

/**
 * Create portable directory structure
 */
function createPortableStructure() {
  console.log('📁 Creating portable directory structure...');
  
  try {
    // Create main directory
    fs.mkdirSync(config.portableDir, { recursive: true });
    
    // Create subdirectories
    const dirs = [
      'docs',
      'examples',
      'data',
      'logs',
      'temp'
    ];
    
    dirs.forEach(dir => {
      fs.mkdirSync(path.join(config.portableDir, dir), { recursive: true });
    });
    
    console.log('  ✅ Created directory structure');
    console.log('✅ Structure created\n');
  } catch (error) {
    console.error('❌ Directory creation failed:', error.message);
    throw error;
  }
}

/**
 * Copy executable and core files
 */
function copyExecutable() {
  console.log('📋 Copying executable and core files...');
  
  try {
    const sourceDir = config.baseReleaseDir;
    
    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory not found: ${sourceDir}. Run npm run build:release first.`);
    }
    
    // Copy executable
    const exeSource = path.join(sourceDir, 'schemock.exe');
    const exeDest = path.join(config.portableDir, 'schemock.exe');
    
    if (!fs.existsSync(exeSource)) {
      throw new Error(`Executable not found: ${exeSource}`);
    }
    
    fs.copyFileSync(exeSource, exeDest);
    console.log('  ✅ Copied schemock.exe');
    
    // Copy version info
    const files = ['version.json', 'build-report.json', 'README.md'];
    files.forEach(file => {
      const src = path.join(sourceDir, file);
      const dest = path.join(config.portableDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✅ Copied ${file}`);
      }
    });
    
    console.log('✅ Core files copied\n');
  } catch (error) {
    console.error('❌ File copying failed:', error.message);
    throw error;
  }
}

/**
 * Copy documentation
 */
function copyDocumentation() {
  console.log('📚 Copying documentation...');
  
  try {
    const sourceDir = path.join(config.baseReleaseDir, 'docs');
    const destDir = path.join(config.portableDir, 'docs');
    
    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      files.forEach(file => {
        fs.copyFileSync(
          path.join(sourceDir, file),
          path.join(destDir, file)
        );
      });
      console.log(`  ✅ Copied ${files.length} documentation files`);
    }
    
    console.log('✅ Documentation copied\n');
  } catch (error) {
    console.error('❌ Documentation copy failed:', error.message);
    throw error;
  }
}

/**
 * Copy examples
 */
function copyExamples() {
  console.log('📝 Copying examples...');
  
  try {
    const sourceDir = path.join(config.baseReleaseDir, 'examples');
    const destDir = path.join(config.portableDir, 'examples');
    
    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      files.forEach(file => {
        const src = path.join(sourceDir, file);
        const dest = path.join(destDir, file);
        
        if (fs.statSync(src).isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          fs.cpSync(src, dest, { recursive: true });
        } else {
          fs.copyFileSync(src, dest);
        }
      });
      console.log(`  ✅ Copied ${files.length} example files`);
    }
    
    console.log('✅ Examples copied\n');
  } catch (error) {
    console.error('❌ Examples copy failed:', error.message);
    throw error;
  }
}

/**
 * Create portable launcher scripts
 */
function createLaunchers() {
  console.log('🚀 Creating portable launchers...');
  
  try {
    // Windows batch launcher
    const batchLauncher = `@echo off
REM Schemock Portable Edition v${config.version}
REM No installation required - runs from any location

title Schemock Portable v${config.version}
setlocal

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Set portable mode environment variable
set SCHEMOCK_PORTABLE=1
set SCHEMOCK_DATA_DIR=%SCRIPT_DIR%data
set SCHEMOCK_LOG_DIR=%SCRIPT_DIR%logs
set SCHEMOCK_TEMP_DIR=%SCRIPT_DIR%temp

REM Create directories if they don't exist
if not exist "%SCHEMOCK_DATA_DIR%" mkdir "%SCHEMOCK_DATA_DIR%"
if not exist "%SCHEMOCK_LOG_DIR%" mkdir "%SCHEMOCK_LOG_DIR%"
if not exist "%SCHEMOCK_TEMP_DIR%" mkdir "%SCHEMOCK_TEMP_DIR%"

REM Display header
cls
echo.
echo ===============================================
echo   Schemock Mock Server - Portable Edition
echo   Version ${config.version}
echo ===============================================
echo.
echo Running in portable mode from:
echo %SCRIPT_DIR%
echo.

REM Check if arguments were provided
if "%~1"=="" (
  echo No arguments provided. Showing help...
  echo.
  schemock.exe --help
  echo.
  echo.
  echo To start with an example:
  echo   schemock-portable.bat start examples\\simple-user.json
  echo.
  pause
) else (
  REM Run with provided arguments
  schemock.exe %*
  
  REM Pause only on error
  if errorlevel 1 (
    echo.
    echo An error occurred. Check logs in: %SCHEMOCK_LOG_DIR%
    pause
  )
)

endlocal
`;

    fs.writeFileSync(
      path.join(config.portableDir, 'schemock-portable.bat'),
      batchLauncher
    );
    console.log('  ✅ Created schemock-portable.bat');

    // Quick start batch file
    const quickStart = `@echo off
REM Quick Start - Runs Schemock with example schema

title Schemock Quick Start
cd /d "%~dp0"

echo.
echo Starting Schemock with example schema...
echo Server will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

schemock.exe start examples\\simple-user.json --port 3000

pause
`;

    fs.writeFileSync(
      path.join(config.portableDir, 'quick-start.bat'),
      quickStart
    );
    console.log('  ✅ Created quick-start.bat');

    // PowerShell launcher (more advanced)
    const psLauncher = `# Schemock Portable Launcher (PowerShell)
# Version ${config.version}

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Set portable mode environment
$env:SCHEMOCK_PORTABLE = "1"
$env:SCHEMOCK_DATA_DIR = Join-Path $ScriptDir "data"
$env:SCHEMOCK_LOG_DIR = Join-Path $ScriptDir "logs"
$env:SCHEMOCK_TEMP_DIR = Join-Path $ScriptDir "temp"

# Create directories
@("data", "logs", "temp") | ForEach-Object {
    $dir = Join-Path $ScriptDir $_
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

# Display header
Clear-Host
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Schemock Mock Server - Portable Edition" -ForegroundColor Cyan
Write-Host "  Version ${config.version}" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running in portable mode from:" -ForegroundColor Yellow
Write-Host $ScriptDir
Write-Host ""

# Run schemock with arguments
try {
    & ".\\schemock.exe" $args
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Check logs in: $env:SCHEMOCK_LOG_DIR"
    Read-Host "Press Enter to exit"
    exit 1
}
`;

    fs.writeFileSync(
      path.join(config.portableDir, 'schemock-portable.ps1'),
      psLauncher
    );
    console.log('  ✅ Created schemock-portable.ps1');

    console.log('✅ Launchers created\n');
  } catch (error) {
    console.error('❌ Launcher creation failed:', error.message);
    throw error;
  }
}

/**
 * Create portable README
 */
function createPortableReadme() {
  console.log('📄 Creating portable README...');
  
  const readme = `# Schemock ${config.version} - Portable Edition

## 🎒 What is Portable Edition?

This is a **fully portable** version of Schemock that:
- ✅ **No installation required** - runs from any location
- ✅ **No registry modifications** - leaves no traces on the system
- ✅ **No administrator rights needed** - runs with user permissions
- ✅ **USB stick friendly** - carry it on portable storage
- ✅ **Multiple instances** - run different versions side-by-side

## 🚀 Quick Start

### Option 1: Double-click Quick Start
1. Double-click \`quick-start.bat\`
2. Server starts with example schema
3. Open http://localhost:3000 in your browser

### Option 2: Command Line (Batch)
1. Open Command Prompt in this folder
2. Run: \`schemock-portable.bat start examples\\simple-user.json\`
3. Access: http://localhost:3000/api/data

### Option 3: PowerShell
1. Open PowerShell in this folder
2. Run: \`.\\schemock-portable.ps1 start examples\\simple-user.json\`
3. Access: http://localhost:3000/api/data

### Option 4: Direct Executable
\`\`\`cmd
schemock.exe start examples\\simple-user.json --port 3000
\`\`\`

## 📁 Directory Structure

\`\`\`
schemock-portable/
├── schemock.exe              # Main executable
├── schemock-portable.bat     # Batch launcher (recommended)
├── schemock-portable.ps1     # PowerShell launcher
├── quick-start.bat           # Quick demo launcher
├── README.md                 # This file
├── version.json              # Version information
├── docs/                     # Documentation
│   ├── user-guide.md
│   ├── api-documentation.md
│   └── troubleshooting.md
├── examples/                 # Example schemas
│   ├── simple-user.json
│   ├── ecommerce-product.json
│   └── task-management.json
├── data/                     # Data directory (created at runtime)
├── logs/                     # Log files (created at runtime)
└── temp/                     # Temporary files (created at runtime)
\`\`\`

## 🎯 Portable Mode Features

When running in portable mode, Schemock:
1. **Uses relative paths** - all references are relative to the executable location
2. **Stores data locally** - all data saved in \`data/\` folder
3. **Logs locally** - all logs saved in \`logs/\` folder
4. **No system changes** - no registry, no PATH, no Start Menu entries
5. **Clean exit** - deleting the folder completely removes Schemock

## 💡 Usage Examples

### Start with Custom Port
\`\`\`cmd
schemock-portable.bat start examples\\simple-user.json --port 8080
\`\`\`

### Enable Watch Mode
\`\`\`cmd
schemock-portable.bat start examples\\simple-user.json --watch
\`\`\`

### Debug Mode
\`\`\`cmd
schemock-portable.bat start examples\\simple-user.json --log-level debug
\`\`\`

### Show Help
\`\`\`cmd
schemock-portable.bat --help
\`\`\`

## 🔧 Configuration

### Environment Variables (Set automatically in portable mode)
- \`SCHEMOCK_PORTABLE=1\` - Enables portable mode
- \`SCHEMOCK_DATA_DIR\` - Points to \`data/\` folder
- \`SCHEMOCK_LOG_DIR\` - Points to \`logs/\` folder
- \`SCHEMOCK_TEMP_DIR\` - Points to \`temp/\` folder

### Custom Configuration
You can create a \`config.json\` file in the root directory:
\`\`\`json
{
  "defaultPort": 3000,
  "defaultHost": "localhost",
  "cors": true,
  "logLevel": "info"
}
\`\`\`

## 📋 System Requirements

- **OS**: Windows 10 or later (64-bit)
- **Memory**: 512MB RAM minimum
- **Disk**: 100MB free space
- **Permissions**: User-level (no admin required)
- **Dependencies**: None - fully self-contained

## 🌐 Network Ports

By default, Schemock uses:
- **Port 3000** - Main API server
- **Port 3001** - Health check endpoint (if enabled)

You can change ports using the \`--port\` flag.

## 📖 Documentation

For detailed documentation, see:
- **User Guide**: \`docs/user-guide.md\`
- **API Documentation**: \`docs/api-documentation.md\`
- **Troubleshooting**: \`docs/troubleshooting.md\`

## 🐛 Troubleshooting

### Executable doesn't run
- Make sure you extracted all files from the ZIP
- Check Windows Defender/antivirus isn't blocking it
- Try running as administrator (right-click → Run as administrator)

### Port already in use
- Change the port: \`schemock-portable.bat start schema.json --port 8080\`
- Check what's using port 3000: \`netstat -ano | findstr :3000\`

### Schema file not found
- Use relative paths from the portable directory
- Example: \`examples\\simple-user.json\` not \`C:\\path\\to\\schema.json\`

### Logs for debugging
Check logs in the \`logs/\` folder:
\`\`\`cmd
type logs\\schemock-latest.log
\`\`\`

## 🔄 Updating

To update to a new version:
1. Download the new portable ZIP
2. Extract to a new folder (or replace old files)
3. Your data in \`data/\` folder is preserved if you extract to the same location

## 🗑️ Uninstalling

To remove Schemock portable:
1. Stop any running Schemock instances
2. Delete the entire folder
3. That's it! No traces left on your system.

## ⚙️ Advanced Usage

### Running Multiple Instances
You can run multiple Schemock instances simultaneously:
\`\`\`cmd
REM Instance 1
schemock.exe start schema1.json --port 3000

REM Instance 2 (in another terminal)
schemock.exe start schema2.json --port 4000
\`\`\`

### Batch Processing
Create a batch file to start multiple servers:
\`\`\`cmd
@echo off
start "Schemock 1" schemock.exe start examples\\simple-user.json --port 3000
start "Schemock 2" schemock.exe start examples\\ecommerce-product.json --port 4000
\`\`\`

## 📞 Support

- **GitHub Issues**: https://github.com/toxzak-svg/schemock-app/issues
- **Documentation**: See \`docs/\` folder
- **Version Info**: See \`version.json\`

## 📄 License

MIT License - See LICENSE file for details.

---

**Portable Edition v${config.version}**  
Built: ${new Date().toISOString()}  
Platform: Windows x64  
Mode: Fully Portable - No Installation Required  

Made with ❤️ by the Schemock Team
`;

  fs.writeFileSync(path.join(config.portableDir, 'README.md'), readme);
  console.log('  ✅ Created README.md');
  console.log('✅ README created\n');
}

/**
 * Create configuration template
 */
function createConfigTemplate() {
  console.log('⚙️  Creating configuration template...');
  
  const configTemplate = {
    defaultPort: 3000,
    defaultHost: 'localhost',
    cors: true,
    logLevel: 'info',
    portableMode: true,
    paths: {
      data: './data',
      logs: './logs',
      temp: './temp'
    },
    server: {
      timeout: 30000,
      keepAlive: true,
      maxConnections: 100
    },
    logging: {
      console: true,
      file: true,
      maxFileSize: '10MB',
      maxFiles: 5
    }
  };

  fs.writeFileSync(
    path.join(config.portableDir, 'config.example.json'),
    JSON.stringify(configTemplate, null, 2)
  );
  
  console.log('  ✅ Created config.example.json');
  console.log('✅ Configuration template created\n');
}

/**
 * Calculate checksums
 */
function calculateChecksums() {
  console.log('🔐 Calculating checksums...');
  
  const checksums = {
    algorithm: 'sha256',
    files: {}
  };

  function hashFile(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  }

  // Hash the executable
  const exePath = path.join(config.portableDir, 'schemock.exe');
  if (fs.existsSync(exePath)) {
    checksums.files['schemock.exe'] = hashFile(exePath);
    console.log('  ✅ Calculated schemock.exe checksum');
  }

  // Save checksums
  fs.writeFileSync(
    path.join(config.portableDir, 'checksums.json'),
    JSON.stringify(checksums, null, 2)
  );

  console.log('  ✅ Saved checksums.json');
  console.log('✅ Checksums calculated\n');
  
  return checksums;
}

/**
 * Create ZIP archive
 */
function createZipArchive() {
  console.log('📦 Creating ZIP archive...');
  console.log('  ℹ️  This may take a moment...');
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(config.outputZip);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`  ✅ ZIP created: ${sizeInMB} MB`);
      console.log(`  📏 Total bytes: ${archive.pointer()}`);
      console.log('✅ ZIP archive created\n');
      resolve({ size: archive.pointer(), path: config.outputZip });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('  ⚠️  Warning:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);
    
    // Add all files from portable directory
    archive.directory(config.portableDir, false);
    
    archive.finalize();
  });
}

/**
 * Generate portable build report
 */
function generateBuildReport(zipInfo, checksums) {
  console.log('📊 Generating build report...');
  
  const report = {
    package: 'Schemock Portable Edition',
    version: config.version,
    buildDate: new Date().toISOString(),
    type: 'portable',
    archive: {
      filename: path.basename(config.outputZip),
      size: zipInfo.size,
      sizeFormatted: `${(zipInfo.size / 1024 / 1024).toFixed(2)} MB`,
      compression: 'ZIP (level 9)',
      path: zipInfo.path
    },
    contents: {
      executable: 'schemock.exe',
      launchers: [
        'schemock-portable.bat',
        'schemock-portable.ps1',
        'quick-start.bat'
      ],
      documentation: 'docs/',
      examples: 'examples/',
      configuration: 'config.example.json'
    },
    features: [
      'No installation required',
      'No system modifications',
      'No registry entries',
      'Runs from any location',
      'USB stick compatible',
      'Multiple instances support',
      'Relative path handling',
      'Local data storage',
      'Clean uninstall (just delete folder)'
    ],
    checksums: checksums,
    systemRequirements: {
      os: 'Windows 10 or later',
      architecture: 'x64',
      memory: '512MB RAM minimum',
      disk: '100MB free space',
      permissions: 'User-level (no admin required)',
      dependencies: 'None'
    },
    usage: {
      quickStart: 'Double-click quick-start.bat',
      batchLauncher: 'schemock-portable.bat [command] [options]',
      powershellLauncher: '.\\schemock-portable.ps1 [command] [options]',
      directExecutable: 'schemock.exe [command] [options]'
    }
  };

  fs.writeFileSync(
    path.join(config.releaseDir, `portable-build-report-${config.version}.json`),
    JSON.stringify(report, null, 2)
  );

  console.log('  ✅ Build report created');
  console.log('✅ Build report generated\n');
  
  return report;
}

/**
 * Main build process
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(`${'='.repeat(50)}\n`);
    
    cleanPortable();
    createPortableStructure();
    copyExecutable();
    copyDocumentation();
    copyExamples();
    createLaunchers();
    createPortableReadme();
    createConfigTemplate();
    const checksums = calculateChecksums();
    const zipInfo = await createZipArchive();
    const report = generateBuildReport(zipInfo, checksums);

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`${'='.repeat(50)}\n`);
    console.log('🎉 Portable package build completed!\n');
    console.log(`📦 Package: ${path.basename(config.outputZip)}`);
    console.log(`📏 Size: ${report.archive.sizeFormatted}`);
    console.log(`⏱️  Build time: ${duration} seconds`);
    console.log(`🔐 Checksum: ${checksums.files['schemock.exe']?.substring(0, 16)}...`);
    console.log(`\n📁 Location: ${config.outputZip}`);
    console.log('\n✅ Portable package is ready for distribution!\n');
    console.log('Next steps:');
    console.log('  1. Test the portable package on a clean system');
    console.log('  2. Verify all launchers work correctly');
    console.log('  3. Test from USB stick or network drive');
    console.log('  4. Upload to GitHub releases\n');

  } catch (error) {
    console.error(`\n${'='.repeat(50)}\n`);
    console.error('❌ Portable build failed!\n');
    console.error(`Error: ${error.message}\n`);
    console.error('Stack trace:', error.stack);
    console.error('\nPlease fix the errors and try again.\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, config };
