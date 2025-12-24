#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Complete Schemock Product Suite');

// Configuration
const config = {
  version: require('../package.json').version,
  productName: 'Schemock',
  description: 'Mock Server Generator',
  author: 'Schemock Team',
  website: 'https://github.com/yourusername/schemock'
};

async function main() {
  try {
    console.log('\n📦 Step 1: Building Core Application...');
    await buildCoreApplication();
    
    console.log('\n🎨 Step 2: Building Professional Installer UI...');
    await buildInstallerUI();
    
    console.log('\n📋 Step 3: Creating Distribution Package...');
    await createDistributionPackage();
    
    console.log('\n✅ Complete Build Process Finished!');
    console.log('\n📁 Generated Files:');
    await listGeneratedFiles();
    
    console.log('\n🎯 Ready for Distribution!');
    console.log(`   Version: ${config.version}`);
    console.log(`   Platforms: Windows x64`);
    console.log(`   Release Date: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    process.exit(1);
  }
}

async function buildCoreApplication() {
  console.log('   🔨 Compiling TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('   📦 Creating Windows executable...');
  execSync('npm run build:exe', { stdio: 'inherit' });
  
  console.log('   ✅ Core application built successfully');
}

async function buildInstallerUI() {
  console.log('   🎨 Preparing installer UI dependencies...');
  
  // Change to installer UI directory and install dependencies
  const installerDir = path.join(__dirname, '../installer-ui');
  
  if (!fs.existsSync(path.join(installerDir, 'node_modules'))) {
    console.log('   📦 Installing Electron dependencies...');
    process.chdir(installerDir);
    execSync('npm install', { stdio: 'inherit' });
    process.chdir(path.join(__dirname, '..'));
  }
  
  console.log('   🏗️ Building installer UI application...');
  process.chdir(installerDir);
  execSync('npm run build:win', { stdio: 'inherit' });
  process.chdir(path.join(__dirname, '..'));
  
  console.log('   ✅ Installer UI built successfully');
}

async function createDistributionPackage() {
  console.log('   📁 Creating distribution structure...');
  
  const releasesDir = 'releases';
  const versionedDir = path.join(releasesDir, `schemock-${config.version}`);
  
  // Ensure directories exist
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }
  
  if (!fs.existsSync(versionedDir)) {
    fs.mkdirSync(versionedDir, { recursive: true });
  }
  
  console.log('   📋 Copying core files...');
  await copyCoreFiles(versionedDir);
  
  console.log('   🎨 Copying installer files...');
  await copyInstallerFiles(versionedDir);
  
  console.log('   📚 Copying documentation...');
  await copyDocumentation(versionedDir);
  
  console.log('   🔐 Preparing for digital signing...');
  await prepareForSigning(versionedDir);
  
  console.log('   ✅ Distribution package created');
}

async function copyCoreFiles(versionedDir) {
  // Copy executable
  const exeSource = path.join('dist', 'executable', 'schemock.exe');
  const exeTarget = path.join(versionedDir, 'schemock.exe');
  if (fs.existsSync(exeSource)) {
    fs.copyFileSync(exeSource, exeTarget);
  }
  
  // Copy batch files
  const batchFiles = ['start.bat', 'help.bat'];
  const sourceBatchDir = path.join('releases', `schemock-${config.version}`);
  for (const file of batchFiles) {
    const source = path.join(sourceBatchDir, file);
    const target = path.join(versionedDir, file);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
    }
  }
  
  // Copy examples
  const examplesDir = path.join(versionedDir, 'examples');
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
  }
  
  // Create example schemas
  const userSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'User Example',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 0, maximum: 120 }
    },
    required: ['id', 'name', 'email']
  };
  
  const productSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Product Example',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1 },
      price: { type: 'number', minimum: 0 },
      category: { type: 'string', enum: ['electronics', 'clothing', 'books'] }
    },
    required: ['id', 'name', 'price', 'category']
  };
  
  fs.writeFileSync(
    path.join(examplesDir, 'user-schema.json'),
    JSON.stringify(userSchema, null, 2)
  );
  
  fs.writeFileSync(
    path.join(examplesDir, 'product-schema.json'),
    JSON.stringify(productSchema, null, 2)
  );
}

async function copyInstallerFiles(versionedDir) {
  const installerDist = path.join('installer-ui', 'dist-installer');
  
  if (fs.existsSync(installerDist)) {
    const files = fs.readdirSync(installerDist);
    for (const file of files) {
      const source = path.join(installerDist, file);
      const target = path.join(versionedDir, file);
      fs.copyFileSync(source, target);
    }
  }
  
  // Create installer launch script
  const installerScript = `@echo off
title Schemock Installer
echo Starting Schemock Professional Installer...
echo.
echo This will install Schemock Mock Server Generator on your system.
echo.
if exist "${path.join(versionedDir, 'Schemock Installer.exe')}" (
    "${path.join(versionedDir, 'Schemock Installer.exe')}"
) else (
    echo Installer not found. Please check the installation files.
    pause
)`;
  
  fs.writeFileSync(
    path.join(versionedDir, 'run-installer.bat'),
    installerScript
  );
}

async function copyDocumentation(versionedDir) {
  const docsDir = path.join(versionedDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Copy all documentation files
  const sourceDocsDir = path.join(__dirname, '../docs');
  if (fs.existsSync(sourceDocsDir)) {
    const docs = fs.readdirSync(sourceDocsDir);
    for (const doc of docs) {
      const source = path.join(sourceDocsDir, doc);
      const target = path.join(docsDir, doc);
      if (fs.statSync(source).isFile()) {
        fs.copyFileSync(source, target);
      }
    }
  }
}

async function prepareForSigning(versionedDir) {
  // Create signing report placeholder
  const signingReport = {
    version: config.version,
    buildDate: new Date().toISOString(),
    files: [
      'schemock.exe',
      'Schemock Installer.exe'
    ],
    signingStatus: 'ready_for_signing',
    instructions: [
      'Use sign-executable.js to sign both executables',
      'Set CODE_SIGNING_CERT and CODE_SIGNING_PASSWORD environment variables',
      'Run: node scripts/sign-executable.js'
    ]
  };
  
  fs.writeFileSync(
    path.join(versionedDir, 'signing-report.json'),
    JSON.stringify(signingReport, null, 2)
  );
  
  // Create unsigned warning
  const unsignedWarning = `# ⚠️  Unsigned Version Warning

This is an **UNSIGNED** version of Schemock ${config.version}.

## Security Notice
When you run these executables, Windows may show security warnings because they are not digitally signed. This is normal for development or unsigned releases.

## Files in This Package
- \`schemock.exe\` - Main application
- \`Schemock Installer.exe\` - Professional installer with UI

## Recommendations
1. **Download Signed Version**: Always prefer signed releases from official sources
2. **Verify Source**: Only download from trusted repositories
3. **Scan for Viruses**: Run antivirus scan before execution
4. **Sandbox**: Run in isolated environment first

## For Production Use
For production environments, please obtain a signed version from:
${config.website}

---
Generated on: ${new Date().toISOString()}
Version: ${config.version}
Platform: Windows x64
Status: UNSIGNED
`;
  
  fs.writeFileSync(
    path.join(versionedDir, 'UNSIGNED-WARNING.md'),
    unsignedWarning
  );
}

async function listGeneratedFiles() {
  const versionedDir = path.join('releases', `schemock-${config.version}`);
  
  if (!fs.existsSync(versionedDir)) {
    console.log('   ❌ No distribution files found');
    return;
  }
  
  const files = fs.readdirSync(versionedDir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(versionedDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   📄 ${file} (${sizeInMB} MB)`);
    } else if (stats.isDirectory()) {
      console.log(`   📁 ${file}/`);
      
      // List directory contents
      try {
        const subFiles = fs.readdirSync(filePath);
        subFiles.forEach(subFile => {
          const subPath = path.join(filePath, subFile);
          const subStats = fs.statSync(subPath);
          if (subStats.isFile()) {
            const subSizeInKB = (subStats.size / 1024).toFixed(1);
            console.log(`      📄 ${subFile} (${subSizeInKB} KB)`);
          }
        });
      } catch (error) {
        console.log(`      (Unable to list contents)`);
      }
    }
  });
  
  // Calculate total size
  let totalSize = 0;
  files.forEach(file => {
    const filePath = path.join(versionedDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(filePath);
          subFiles.forEach(subFile => {
            const subPath = path.join(filePath, subFile);
            const subStats = fs.statSync(subPath);
            if (subStats.isFile()) {
              totalSize += subStats.size;
            }
          });
        } catch (error) {
          // Ignore directory listing errors
        }
      }
    } catch (error) {
      // Ignore stat errors
    }
  });
  
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`   📏 Total Size: ${totalSizeInMB} MB`);
}

// Create comprehensive README for the complete package
async function createCompleteREADME() {
  const readme = `# Schemock v${config.version} - Complete Professional Package

## 🚀 What's Included

This package contains everything you need to deploy Schemock Mock Server Generator in a professional environment.

### Core Components
- **schemock.exe** - Standalone Windows executable (73MB)
- **Schemock Installer.exe** - Professional installer with graphical UI
- **Complete Documentation** - 5 comprehensive guides and tutorials
- **Example Schemas** - Ready-to-use JSON schema examples

### Installation Options

#### Option 1: Professional Installer (Recommended)
1. Run \`Schemock Installer.exe\`
2. Follow the graphical installation wizard
3. Choose installation path and components
4. Launch from Start Menu or Desktop

#### Option 2: Manual Installation
1. Extract all files to desired directory
2. Run \`schemock.exe\` directly
3. Copy documentation and examples as needed

#### Option 3: Developer Installation
\`\`\`bash
npm install -g schemock
schemock start
\`\`\`

### Quick Start
After installation:

\`\`\`bash
# Using the installer version
schemock start examples/user-schema.json --port 3000

# Or using the installed executable
"schemock.exe" start examples/product-schema.json --log-level debug
\`\`\`

Open http://localhost:3000 in your browser to access the mock API.

### What Makes This Professional

- ✅ **Graphical Installer** - Professional wizard interface
- ✅ **System Validation** - Automatic requirement checking
- ✅ **Component Selection** - Choose what to install
- ✅ **Progress Tracking** - Real-time installation status
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Uninstall Support** - Complete removal via Windows Programs
- ✅ **Documentation Suite** - Complete guides and tutorials
- ✅ **Quality Assurance** - Thoroughly tested and validated

### System Requirements

- **OS**: Windows 10 or later (x64)
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Disk**: 100MB free space
- **Dependencies**: None (self-contained)

### Security Information

This version is **UNSIGNED**. For production use, please download a signed version from:
${config.website}

## 📚 Documentation

- **Installation Guide** - Detailed setup instructions
- **User Guide** - Step-by-step tutorials
- **API Documentation** - Complete reference
- **Technical Specs** - Architecture details
- **Troubleshooting** - Common issues and solutions

## 🆘 Support

- **Issues**: [GitHub Issues](${config.website}/issues)
- **Documentation**: [Documentation Site](${config.website}/docs)
- **Community**: [GitHub Discussions](${config.website}/discussions)

---

Version: ${config.version}
Build Date: ${new Date().toISOString()}
Platform: Windows x64
Status: Professional Release Package
`;

  const readmePath = path.join('releases', `schemock-${config.version}`, 'README.md');
  fs.writeFileSync(readmePath, readme);
  console.log('   📖 Complete README created');
}

// Run the main build process
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Complete product suite built successfully!');
      console.log('\n🚀 Ready for enterprise distribution!');
    })
    .catch(error => {
      console.error('\n💥 Build failed:', error);
      process.exit(1);
    });
}

module.exports = { main, buildCoreApplication, buildInstallerUI, createDistributionPackage };