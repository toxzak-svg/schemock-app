#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Packaging Schemock Installer with UI...');

// Configuration
const config = {
  version: require('../package.json').version,
  productName: 'Schemock',
  description: 'Mock Server Generator',
  author: 'Schemock Team',
  website: 'https://github.com/toxzak-svg/schemock-app'
};

async function main() {
  try {
    console.log('\n📋 Step 1: Creating distribution structure...');
    await createDistributionPackage();
    
    console.log('\n✅ Packaging Complete!');
    console.log('\n📁 Generated Files:');
    await listGeneratedFiles();
    
    console.log('\n🎯 Ready for Distribution!');
    console.log(`   Version: ${config.version}`);
    console.log(`   Platforms: Windows x64`);
    console.log(`   Release Date: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Packaging failed:', error.message);
    process.exit(1);
  }
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
  
  console.log('   📝 Creating README...');
  await createCompleteREADME(versionedDir);
  
  console.log('   ✅ Distribution package created');
}

async function copyCoreFiles(versionedDir) {
  // Copy executable
  const exeSource = path.join('dist', 'executable', 'schemock.exe');
  const exeTarget = path.join(versionedDir, 'schemock.exe');
  if (fs.existsSync(exeSource)) {
    fs.copyFileSync(exeSource, exeTarget);
    console.log('      ✅ Copied schemock.exe');
  } else {
    console.log('      ⚠️  Warning: schemock.exe not found');
  }
  
  // Copy examples
  const examplesDir = path.join(versionedDir, 'examples');
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
  }
  
  // Copy existing examples
  const sourceExamplesDir = 'examples';
  if (fs.existsSync(sourceExamplesDir)) {
    const exampleFiles = fs.readdirSync(sourceExamplesDir);
    for (const file of exampleFiles) {
      const source = path.join(sourceExamplesDir, file);
      const target = path.join(examplesDir, file);
      if (fs.statSync(source).isFile()) {
        fs.copyFileSync(source, target);
      }
    }
    console.log('      ✅ Copied examples');
  }
}

async function copyInstallerFiles(versionedDir) {
  const installerDist = path.join('installer-ui', 'dist-installer');
  
  if (fs.existsSync(installerDist)) {
    const files = fs.readdirSync(installerDist);
    for (const file of files) {
      const source = path.join(installerDist, file);
      const target = path.join(versionedDir, file);
      if (fs.statSync(source).isFile()) {
        fs.copyFileSync(source, target);
      }
    }
    console.log('      ✅ Copied installer files');
  } else {
    console.log('      ⚠️  Warning: Installer files not found');
  }
}

async function copyDocumentation(versionedDir) {
  const docsDir = path.join(versionedDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Copy all documentation files
  const sourceDocsDir = path.join(__dirname, '../docs');
  if (fs.existsSync(sourceDocsDir)) {
    const copyDir = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir(sourceDocsDir, docsDir);
    console.log('      ✅ Copied documentation');
  }
}

async function createCompleteREADME(versionedDir) {
  const readme = `# Schemock v${config.version} - Complete Professional Package

## 🚀 What's Included

This package contains everything you need to deploy Schemock Mock Server Generator in a professional environment.

### Core Components
- **schemock.exe** - Standalone Windows executable
- **Schemock Installer Setup ${config.version}.exe** - Professional installer with graphical UI
- **Complete Documentation** - Comprehensive guides and tutorials
- **Example Schemas** - Ready-to-use JSON schema examples

### Installation Options

#### Option 1: Professional Installer (Recommended)
1. Run \`Schemock Installer Setup ${config.version}.exe\`
2. Follow the graphical installation wizard
3. Choose installation path and components
4. Launch from Start Menu or Desktop

#### Option 2: Manual Installation
1. Extract all files to desired directory
2. Run \`schemock.exe\` directly
3. Copy documentation and examples as needed

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

  const readmePath = path.join(versionedDir, 'README.md');
  fs.writeFileSync(readmePath, readme);
  console.log('      ✅ Created README');
}

async function listGeneratedFiles() {
  const versionedDir = path.join('releases', `schemock-${config.version}`);
  
  if (!fs.existsSync(versionedDir)) {
    console.log('   ❌ No distribution files found');
    return;
  }
  
  const files = fs.readdirSync(versionedDir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(versionedDir, file.name);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   📄 ${file.name} (${sizeInMB} MB)`);
    } else if (stats.isDirectory()) {
      console.log(`   📁 ${file.name}/`);
      
      // List directory contents
      try {
        const subFiles = fs.readdirSync(filePath, { withFileTypes: true });
        subFiles.forEach(subFile => {
          const subPath = path.join(filePath, subFile.name);
          const subStats = fs.statSync(subPath);
          if (subStats.isFile()) {
            const subSizeInKB = (subStats.size / 1024).toFixed(1);
            console.log(`      📄 ${subFile.name} (${subSizeInKB} KB)`);
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
    const filePath = path.join(versionedDir, file.name);
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(filePath, { withFileTypes: true });
          subFiles.forEach(subFile => {
            const subPath = path.join(filePath, subFile.name);
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

// Run the main build process
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Packaging completed successfully!');
      console.log('\n🚀 Ready for distribution!');
    })
    .catch(error => {
      console.error('\n💥 Packaging failed:', error);
      process.exit(1);
    });
}

module.exports = { main, createDistributionPackage };
