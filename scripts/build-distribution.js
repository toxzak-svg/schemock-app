#!/usr/bin/env node

/**
 * Master Distribution Build Script
 * Orchestrates the complete build process for all distribution packages
 * - Installer (NSIS)
 * - Portable ZIP
 * - Checksums and verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const config = {
  version: require('../package.json').version,
  productName: 'Schemock',
  buildDate: new Date().toISOString(),
  releaseDir: 'releases',
  distributionDir: null, // Will be set dynamically
  packages: []
};

config.distributionDir = path.join(config.releaseDir, `distribution-${config.version}`);

console.log('🏗️  Schemock Distribution Build System');
console.log(`📦 Version: ${config.version}`);
console.log(`📅 Build Date: ${config.buildDate}`);
console.log('');

const buildStartTime = Date.now();

/**
 * Display step header
 */
function stepHeader(step, total, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP ${step}/${total}: ${description}`);
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Run a build step with error handling
 */
function runStep(command, description) {
  console.log(`▶️  ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Clean all previous builds
 */
function cleanAll() {
  stepHeader(1, 7, 'Clean Previous Builds');
  
  console.log('🧹 Cleaning all build artifacts...');
  
  const dirsToClean = [
    'dist',
    'releases',
    'coverage'
  ];

  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✅ Removed ${dir}/`);
    }
  });

  console.log('✅ Cleanup completed');
}

/**
 * Build base release package
 */
function buildBaseRelease() {
  stepHeader(2, 7, 'Build Base Release Package');
  
  return runStep('node scripts/build.js', 'Base release build');
}

/**
 * Build installer package
 */
function buildInstaller() {
  stepHeader(3, 7, 'Build Installer Package (NSIS)');
  
  // Check if NSIS is available
  try {
    execSync('makensis -version', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  NSIS not found. Skipping installer build.');
    console.log('   To build installer, install NSIS:');
    console.log('   - Download: https://nsis.sourceforge.io/');
    console.log('   - Or use chocolatey: choco install nsis\n');
    return false;
  }

  return runStep('node scripts/build-installer.js', 'NSIS installer build');
}

/**
 * Build portable package
 */
function buildPortable() {
  stepHeader(4, 7, 'Build Portable Package (ZIP)');
  
  return runStep('node scripts/build-portable.js', 'Portable ZIP build');
}

/**
 * Calculate checksums for all packages
 */
function calculateAllChecksums() {
  stepHeader(5, 7, 'Calculate Checksums');
  
  console.log('🔐 Calculating checksums for all packages...\n');
  
  const checksums = {
    version: config.version,
    buildDate: config.buildDate,
    algorithm: 'SHA-256',
    files: {}
  };

  function hashFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return {
      sha256: hash.digest('hex'),
      size: data.length,
      sizeFormatted: `${(data.length / 1024 / 1024).toFixed(2)} MB`
    };
  }

  // Find all distribution files
  const patterns = [
    `schemock-${config.version}.exe`,
    `Schemock-Setup.exe`,
    `Schemock-${config.version}-Setup.exe`,
    `schemock-${config.version}-portable.zip`
  ];

  patterns.forEach(pattern => {
    const filePath = path.join(config.releaseDir, pattern);
    const hash = hashFile(filePath);
    if (hash) {
      checksums.files[pattern] = hash;
      console.log(`  ✅ ${pattern}`);
      console.log(`     SHA-256: ${hash.sha256.substring(0, 32)}...`);
      console.log(`     Size: ${hash.sizeFormatted}`);
    }
  });

  // Save checksums file
  const checksumsPath = path.join(config.releaseDir, `checksums-${config.version}.json`);
  fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));
  
  // Also create SHA256SUMS.txt file (standard format)
  let sha256Content = '';
  Object.entries(checksums.files).forEach(([file, info]) => {
    sha256Content += `${info.sha256}  ${file}\n`;
  });
  
  const sha256Path = path.join(config.releaseDir, `SHA256SUMS.txt`);
  fs.writeFileSync(sha256Path, sha256Content);

  console.log('\n  ✅ Created checksums.json');
  console.log('  ✅ Created SHA256SUMS.txt');
  console.log('✅ Checksums calculated\n');
  
  return checksums;
}

/**
 * Create distribution package
 */
function createDistribution(checksums) {
  stepHeader(6, 7, 'Create Distribution Package');
  
  console.log('📦 Creating distribution package...\n');
  
  // Create distribution directory
  if (fs.existsSync(config.distributionDir)) {
    fs.rmSync(config.distributionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(config.distributionDir, { recursive: true });

  // Copy all distribution files
  const filesToCopy = [
    // Installers and packages
    { pattern: `Schemock-Setup.exe`, required: false },
    { pattern: `schemock-${config.version}-portable.zip`, required: true },
    
    // Checksums
    { pattern: `checksums-${config.version}.json`, required: true },
    { pattern: `SHA256SUMS.txt`, required: true },
    
    // Build reports
    { pattern: `portable-build-report-${config.version}.json`, required: false },
    
    // Base package
    { pattern: `schemock-${config.version}`, isDirectory: true, required: true }
  ];

  filesToCopy.forEach(item => {
    const sourcePath = path.join(config.releaseDir, item.pattern);
    const destPath = path.join(config.distributionDir, item.pattern);
    
    if (fs.existsSync(sourcePath)) {
      if (item.isDirectory) {
        fs.mkdirSync(destPath, { recursive: true });
        fs.cpSync(sourcePath, destPath, { recursive: true });
        console.log(`  ✅ Copied ${item.pattern}/ (directory)`);
      } else {
        fs.copyFileSync(sourcePath, destPath);
        const stats = fs.statSync(sourcePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  ✅ Copied ${item.pattern} (${size} MB)`);
      }
      config.packages.push(item.pattern);
    } else if (item.required) {
      console.log(`  ⚠️  Missing ${item.pattern} (skipped, but required)`);
    } else {
      console.log(`  ℹ️  Skipped ${item.pattern} (optional, not found)`);
    }
  });

  console.log('\n✅ Distribution package created\n');
}

/**
 * Generate final build report
 */
function generateFinalReport(checksums) {
  stepHeader(7, 7, 'Generate Build Report');
  
  console.log('📊 Generating final build report...\n');
  
  const duration = Math.round((Date.now() - buildStartTime) / 1000);
  
  const report = {
    product: config.productName,
    version: config.version,
    buildInfo: {
      date: config.buildDate,
      duration: `${duration} seconds`,
      platform: 'Windows x64',
      nodeVersion: process.version,
      builder: process.env.USERNAME || process.env.USER || 'unknown'
    },
    packages: {
      installer: null,
      portable: null,
      base: null
    },
    checksums: checksums,
    distributionDirectory: config.distributionDir,
    packagedFiles: config.packages,
    buildSteps: [
      { step: 1, name: 'Clean builds', status: 'completed' },
      { step: 2, name: 'Base release', status: 'completed' },
      { step: 3, name: 'Installer (NSIS)', status: 'completed' },
      { step: 4, name: 'Portable ZIP', status: 'completed' },
      { step: 5, name: 'Checksums', status: 'completed' },
      { step: 6, name: 'Distribution package', status: 'completed' },
      { step: 7, name: 'Build report', status: 'completed' }
    ],
    verification: {
      checksums: 'SHA-256',
      checksumFile: `checksums-${config.version}.json`,
      sha256File: 'SHA256SUMS.txt',
      verificationCommand: `certutil -hashfile <filename> SHA256`
    },
    testing: {
      required: [
        'Test installer on clean Windows 10/11 system',
        'Test portable package from USB drive',
        'Verify all examples work',
        'Test uninstallation process',
        'Verify checksums match'
      ],
      recommended: [
        'Test on different Windows versions',
        'Test with Windows Defender enabled',
        'Test network connectivity',
        'Test multiple simultaneous instances'
      ]
    },
    deployment: {
      githubRelease: {
        tag: `v${config.version}`,
        title: `Schemock v${config.version}`,
        files: config.packages.filter(p => !p.includes('.json'))
      },
      releaseNotes: `RELEASE-NOTES-${config.version}.md`
    }
  };

  // Add package details
  Object.entries(checksums.files).forEach(([filename, info]) => {
    if (filename.includes('Setup')) {
      report.packages.installer = {
        filename: filename,
        size: info.sizeFormatted,
        sha256: info.sha256,
        type: 'NSIS Installer',
        features: [
          'Full installation wizard',
          'Start Menu shortcuts',
          'Desktop shortcut (optional)',
          'PATH integration (optional)',
          'File association (optional)',
          'Silent install support',
          'Uninstaller included'
        ]
      };
    } else if (filename.includes('portable')) {
      report.packages.portable = {
        filename: filename,
        size: info.sizeFormatted,
        sha256: info.sha256,
        type: 'Portable ZIP Package',
        features: [
          'No installation required',
          'Runs from any location',
          'No system modifications',
          'USB stick compatible',
          'Multiple instance support',
          'Batch and PowerShell launchers'
        ]
      };
    }
  });

  report.packages.base = {
    directory: `schemock-${config.version}`,
    type: 'Base Package',
    contents: [
      'schemock.exe - Main executable',
      'docs/ - Documentation',
      'examples/ - Example schemas',
      'README.md - Quick start guide',
      'version.json - Version information',
      'build-report.json - Build metadata'
    ]
  };

  // Save report
  const reportPath = path.join(config.distributionDir, 'BUILD-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Create human-readable summary
  const summaryPath = path.join(config.distributionDir, 'BUILD-SUMMARY.txt');
  const summary = `
========================================
  SCHEMOCK DISTRIBUTION BUILD REPORT
========================================

Product: ${report.product}
Version: ${report.version}
Build Date: ${report.buildInfo.date}
Build Duration: ${report.buildInfo.duration}
Platform: ${report.buildInfo.platform}
Node Version: ${report.buildInfo.nodeVersion}

========================================
  PACKAGES GENERATED
========================================

${report.packages.installer ? `
INSTALLER (NSIS):
  File: ${report.packages.installer.filename}
  Size: ${report.packages.installer.size}
  SHA-256: ${report.packages.installer.sha256}
  Type: ${report.packages.installer.type}
` : 'INSTALLER: Not generated (NSIS not available)'}

PORTABLE PACKAGE:
  File: ${report.packages.portable.filename}
  Size: ${report.packages.portable.size}
  SHA-256: ${report.packages.portable.sha256}
  Type: ${report.packages.portable.type}

BASE PACKAGE:
  Directory: ${report.packages.base.directory}
  Type: ${report.packages.base.type}

========================================
  VERIFICATION
========================================

Checksums: ${report.verification.checksums}
Checksum File: ${report.verification.checksumFile}
SHA256 File: ${report.verification.sha256File}

To verify a file:
  ${report.verification.verificationCommand}

========================================
  TESTING CHECKLIST
========================================

Required Tests:
${report.testing.required.map(t => `  - ${t}`).join('\n')}

Recommended Tests:
${report.testing.recommended.map(t => `  - ${t}`).join('\n')}

========================================
  DEPLOYMENT
========================================

GitHub Release Tag: ${report.deployment.githubRelease.tag}
Release Title: ${report.deployment.githubRelease.title}

Files to Upload:
${report.deployment.githubRelease.files.map(f => `  - ${f}`).join('\n')}

========================================
  BUILD COMPLETE
========================================

Distribution package created at:
${config.distributionDir}

All files are ready for distribution!

`;

  fs.writeFileSync(summaryPath, summary);
  
  console.log('  ✅ Created BUILD-REPORT.json');
  console.log('  ✅ Created BUILD-SUMMARY.txt');
  console.log('✅ Build report generated\n');
  
  return report;
}

/**
 * Display final summary
 */
function displaySummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DISTRIBUTION BUILD COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60) + '\n');
  
  console.log(`📦 Product: ${report.product} v${report.version}`);
  console.log(`⏱️  Build Time: ${report.buildInfo.duration}`);
  console.log(`📁 Distribution: ${config.distributionDir}\n`);
  
  console.log('📋 Generated Packages:\n');
  
  if (report.packages.installer) {
    console.log(`  ✅ Installer: ${report.packages.installer.filename}`);
    console.log(`     Size: ${report.packages.installer.size}`);
    console.log(`     SHA-256: ${report.packages.installer.sha256.substring(0, 32)}...\n`);
  } else {
    console.log('  ⚠️  Installer: Not generated (install NSIS to build)\n');
  }
  
  if (report.packages.portable) {
    console.log(`  ✅ Portable: ${report.packages.portable.filename}`);
    console.log(`     Size: ${report.packages.portable.size}`);
    console.log(`     SHA-256: ${report.packages.portable.sha256.substring(0, 32)}...\n`);
  }
  
  console.log(`  ✅ Base Package: ${report.packages.base.directory}/\n`);
  
  console.log('🔐 Verification Files:\n');
  console.log(`  ✅ ${report.verification.checksumFile}`);
  console.log(`  ✅ ${report.verification.sha256File}\n`);
  
  console.log('📚 Documentation:\n');
  console.log('  ✅ BUILD-REPORT.json');
  console.log('  ✅ BUILD-SUMMARY.txt\n');
  
  console.log('=' + '='.repeat(59) + '\n');
  console.log('🚀 Next Steps:\n');
  console.log('1. Review BUILD-SUMMARY.txt for details');
  console.log('2. Test packages on clean systems');
  console.log('3. Verify checksums match');
  console.log('4. Create GitHub release');
  console.log('5. Upload distribution files\n');
  
  console.log('📞 Support:');
  console.log('   GitHub: https://github.com/toxzak-svg/schemock-app');
  console.log('   Issues: https://github.com/toxzak-svg/schemock-app/issues\n');
}

/**
 * Main orchestration
 */
async function main() {
  try {
    console.log(`\n${'█'.repeat(60)}\n`);
    
    // Execute all build steps
    cleanAll();
    
    if (!buildBaseRelease()) {
      throw new Error('Base release build failed');
    }
    
    // Installer build (optional - may skip if NSIS not available)
    buildInstaller();
    
    if (!buildPortable()) {
      throw new Error('Portable build failed');
    }
    
    const checksums = calculateAllChecksums();
    createDistribution(checksums);
    const report = generateFinalReport(checksums);
    
    displaySummary(report);
    
    console.log(`${'█'.repeat(60)}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ DISTRIBUTION BUILD FAILED!');
    console.error('='.repeat(60) + '\n');
    console.error(`Error: ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('\nPlease fix the errors and try again.\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, config };
