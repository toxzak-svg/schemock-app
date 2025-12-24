#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build configuration
const config = {
  version: process.env.npm_package_version || '1.0.0',
  buildDir: 'dist',
  executableDir: 'dist/executable',
  releaseDir: 'releases',
  packageName: 'schemock',
  productName: 'Schemock Mock Server',
  company: 'Schemock Team',
  description: 'A lightweight mock server generator from JSON schemas'
};

console.log('🚀 Starting Schemock Build Process');
console.log(`📦 Version: ${config.version}`);
console.log(`📁 Build Directory: ${config.buildDir}`);
console.log('');

// Track build time
const buildStartTime = Date.now();

// Clean previous builds
function cleanBuild() {
  console.log('🧹 Cleaning previous builds...');
  
  try {
    // Kill any running schemock processes first
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM schemock.exe 2>nul', { stdio: 'ignore' });
        execSync('timeout /t 1 /nobreak >nul 2>&1', { stdio: 'ignore' });
      } catch (e) {
        // Process not running, continue
      }
    }
    
    if (fs.existsSync(config.buildDir)) {
      try {
        fs.rmSync(config.buildDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        console.log(`  ✅ Removed ${config.buildDir}/`);
      } catch (error) {
        console.log(`  ⚠️  Could not remove ${config.buildDir}/, renaming instead`);
        const oldName = `${config.buildDir}.old.${Date.now()}`;
        fs.renameSync(config.buildDir, oldName);
        console.log(`  ✅ Renamed to ${oldName}/`);
      }
    }
    
    if (fs.existsSync(config.releaseDir)) {
      try {
        fs.rmSync(config.releaseDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        console.log(`  ✅ Removed ${config.releaseDir}/`);
      } catch (error) {
        console.log(`  ⚠️  Could not remove ${config.releaseDir}/, renaming instead`);
        const oldName = `${config.releaseDir}.old.${Date.now()}`;
        try {
          fs.renameSync(config.releaseDir, oldName);
          console.log(`  ✅ Renamed to ${oldName}/`);
        } catch (renameError) {
          console.log(`  ⚠️  Could not rename, continuing anyway...`);
        }
      }
    }
    
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.error('⚠️  Cleanup had issues but continuing:', error.message);
    // Don't throw, just continue
  }
}

// Compile TypeScript
function compileTypeScript() {
  console.log('📝 Compiling TypeScript...');
  
  try {
    // Run the build command which includes UI template generation
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed\n');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    console.error('   Please check for syntax errors and try again.');
    throw error;
  }
}

// Run tests
function runTests() {
  console.log('🧪 Running tests...');
  
  try {
    const testOutput = execSync('npm test', { stdio: 'pipe' }).toString();
    
    // Parse test results
    const passMatch = testOutput.match(/Tests:\s+(\d+)\s+passed/);
    const failMatch = testOutput.match(/(\d+)\s+failed/);
    const totalMatch = testOutput.match(/(\d+)\s+total/);
    
    if (passMatch && totalMatch) {
      console.log(`  ✅ ${passMatch[1]}/${totalMatch[1]} tests passed`);
    }
    
    if (failMatch && parseInt(failMatch[1]) > 0) {
      throw new Error(`${failMatch[1]} tests failed`);
    }
    
    console.log('✅ All tests passed\n');
    return testOutput;
  } catch (error) {
    console.error('❌ Tests failed');
    console.error('   Please fix failing tests before building.');
    throw error;
  }
}

// Create executable
function createExecutable() {
  console.log('🏗️  Creating Windows executable...');
  console.log('   This may take a few minutes...');
  
  try {
    execSync('npm run build:exe', { stdio: 'inherit' });
    
    // Verify executable was created
    const exePath = path.join(config.executableDir, 'schemock.exe');
    if (!fs.existsSync(exePath)) {
      throw new Error('Executable was not created');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  ✅ Executable created: ${sizeMB} MB`);
    console.log('✅ Executable creation completed\n');
  } catch (error) {
    console.error('❌ Executable creation failed');
    console.error('   Check pkg configuration and try again.');
    throw error;
  }
}

// Create release directory structure
function createReleaseStructure() {
  console.log('📁 Creating release structure...');
  
  if (!fs.existsSync(config.releaseDir)) {
    fs.mkdirSync(config.releaseDir, { recursive: true });
  }

  const releaseVersionDir = path.join(config.releaseDir, `schemock-${config.version}`);
  if (fs.existsSync(releaseVersionDir)) {
    fs.rmSync(releaseVersionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(releaseVersionDir, { recursive: true });

  console.log(`  ✅ Created ${releaseVersionDir}/`);
  console.log('✅ Release structure created\n');
  
  return releaseVersionDir;
}

// Copy files to release directory
function copyReleaseFiles(releaseDir) {
  console.log('📋 Copying release files...');
  
  let copiedFiles = 0;
  
  try {
    // Copy executable
    const executableSource = path.join(config.executableDir, 'schemock.exe');
    const executableDest = path.join(releaseDir, 'schemock.exe');
    
    if (!fs.existsSync(executableSource)) {
      throw new Error(`Executable not found: ${executableSource}`);
    }
    
    fs.copyFileSync(executableSource, executableDest);
    console.log('  ✅ Copied schemock.exe');
    copiedFiles++;

    // Copy documentation
    const docsDir = path.join(releaseDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    
    const docsFiles = [
      'installation-setup.md',
      'user-guide.md',
      'api-documentation.md',
      'technical-specifications.md',
      'troubleshooting.md'
    ];

    docsFiles.forEach(doc => {
      const sourceDoc = path.join('docs', doc);
      const destDoc = path.join(docsDir, doc);
      if (fs.existsSync(sourceDoc)) {
        fs.copyFileSync(sourceDoc, destDoc);
        copiedFiles++;
      }
    });
    console.log(`  ✅ Copied ${docsFiles.length} documentation files`);

    // Copy production guides
    const guides = [
      'BUILD-GUIDE.md',
      'DEPLOYMENT-GUIDE.md',
      'CODE-QUALITY-REPORT.md'
    ];
    
    guides.forEach(guide => {
      if (fs.existsSync(guide)) {
        fs.copyFileSync(guide, path.join(releaseDir, guide));
        copiedFiles++;
      }
    });
    console.log(`  ✅ Copied production guides`);

    // Copy examples and schemas
    const examplesDir = path.join(releaseDir, 'examples');
    fs.mkdirSync(examplesDir, { recursive: true });
    
    const examples = [
      {
        file: 'user-schema.json',
        content: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'User Schema',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            age: { type: 'integer', minimum: 0, maximum: 120 }
          },
          required: ['id', 'name', 'email']
        }
      },
      {
        file: 'product-schema.json',
        content: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'Product Schema',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1 },
            price: { type: 'number', minimum: 0 },
            category: { type: 'string', enum: ['electronics', 'clothing', 'books'] }
          },
          required: ['id', 'name', 'price', 'category']
        }
      }
    ];

    examples.forEach(example => {
      fs.writeFileSync(
        path.join(examplesDir, example.file),
        JSON.stringify(example.content, null, 2)
      );
      copiedFiles++;
    });
    console.log(`  ✅ Created ${examples.length} example schemas`);

    // Create README for release
    const readmeContent = `# Schemock ${config.version}

## Quick Start

1. **Run the executable**:
   \`\`\`bash
   .\\schemock.exe start examples\\user-schema.json
   \`\`\`

2. **Access the mock server**:
   Open http://localhost:3000 in your browser

3. **Test the API**:
   \`\`\`powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/data
   \`\`\`

## Features

✅ Generate mock APIs from JSON schemas  
✅ Support for complex data types and relationships  
✅ RESTful API endpoints  
✅ Custom response generation  
✅ Built-in CLI tools  
✅ Watch mode for auto-reload  
✅ No installation required - just run!

## Command Reference

### Start Server
\`\`\`bash
.\\schemock.exe start [schema.json] [options]
\`\`\`

Options:
- \`-p, --port <number>\` - Port to run server (default: 3000)
- \`--no-cors\` - Disable CORS
- \`--log-level <level>\` - Set log level (error|warn|info|debug)
- \`-w, --watch\` - Watch schema file for changes

### Initialize New Project
\`\`\`bash
.\\schemock.exe init [directory] [options]
\`\`\`

### Get Help
\`\`\`bash
.\\schemock.exe --help
.\\schemock.exe start --help
\`\`\`

## Documentation

For comprehensive documentation, see:
- **User Guide**: docs/user-guide.md
- **API Documentation**: docs/api-documentation.md
- **Build Guide**: BUILD-GUIDE.md
- **Deployment Guide**: DEPLOYMENT-GUIDE.md
- **Troubleshooting**: docs/troubleshooting.md

## System Requirements

- **OS**: Windows 10 or later (64-bit)
- **Memory**: 512MB RAM minimum
- **Disk**: 100MB free space
- **No Node.js installation required!**

## Examples

### Basic Usage
\`\`\`bash
# Start with example schema
.\\schemock.exe start examples\\user-schema.json

# Use custom port
.\\schemock.exe start examples\\product-schema.json --port 8080

# Enable watch mode
.\\schemock.exe start examples\\user-schema.json --watch

# Debug mode
.\\schemock.exe start examples\\user-schema.json --log-level debug
\`\`\`

### Create New Project
\`\`\`bash
# Initialize new project
.\\schemock.exe init my-api

# Navigate and set up
cd my-api
npm install
npm start
\`\`\`

## Support

- **Issues**: https://github.com/toxzak-svg/schemock-app/issues
- **Documentation**: See docs/ folder
- **Version**: ${config.version}
- **Build Date**: ${new Date().toISOString()}

## License

MIT License - See LICENSE file for details.

---

Made with ❤️ by the Schemock Team
`;
    
    fs.writeFileSync(path.join(releaseDir, 'README.md'), readmeContent);
    console.log('  ✅ Created README.md');
    copiedFiles++;

    console.log(`✅ Copied ${copiedFiles} files to release\n`);
  } catch (error) {
    console.error('❌ File copying failed:', error.message);
    throw error;
  }
}

// Create version info file
function createVersionInfo(releaseDir) {
  console.log('📄 Creating version information...');
  
  const versionInfo = {
    version: config.version,
    buildDate: new Date().toISOString(),
    buildNumber: process.env.BUILD_NUMBER || 'local',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    gitBranch: process.env.GIT_BRANCH || 'main',
    productName: config.productName,
    company: config.company,
    description: config.description,
    platform: 'Windows x64',
    nodeVersion: '18.5.0',
    dependencies: {
      express: '^4.18.2',
      commander: '^11.1.0',
      chalk: '^4.1.2',
      cors: '^2.8.5',
      uuid: '^9.0.1',
      chokidar: '^5.0.0'
    },
    features: [
      'JSON Schema to Mock API Generation',
      'RESTful Endpoint Creation',
      'CLI Interface',
      'Custom Response Handlers',
      'CORS Support',
      'Request Logging',
      'Error Handling',
      'Schema Hot Reload (Watch Mode)',
      'Interactive Installer',
      'Project Scaffolding'
    ],
    systemRequirements: {
      os: 'Windows 10 or later',
      architecture: 'x64',
      memory: '512MB RAM minimum',
      disk: '100MB free space',
      prerequisites: 'None - standalone executable'
    }
  };

  fs.writeFileSync(
    path.join(releaseDir, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );

  console.log('  ✅ version.json created');
  console.log('✅ Version information created\n');
}

// Create batch files for easy execution
function createBatchFiles(releaseDir) {
  console.log('⚡ Creating batch files...');
  
  // Start with default schema
  const startBatchContent = `@echo off
title Schemock Mock Server
echo =====================================
echo   Schemock Mock Server v${config.version}
echo =====================================
echo.
echo Starting with example schema...
echo Server will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
schemock.exe start examples\\user-schema.json
pause
`;

  // Help batch file
  const helpBatchContent = `@echo off
title Schemock Help
cls
echo =====================================
echo   Schemock Mock Server - Help
echo =====================================
echo.
schemock.exe --help
echo.
echo.
echo For more information, see:
echo - README.md
echo - docs\\user-guide.md
echo - DEPLOYMENT-GUIDE.md
echo.
pause
`;

  // Install batch file (for UI installer)
  const installBatchContent = `@echo off
title Schemock Installer
echo =====================================
echo   Schemock Interactive Installer
echo =====================================
echo.
echo Launching installer UI...
echo The installer will open in your browser
echo.
schemock.exe install
pause
`;

  fs.writeFileSync(path.join(releaseDir, 'start.bat'), startBatchContent);
  fs.writeFileSync(path.join(releaseDir, 'help.bat'), helpBatchContent);
  fs.writeFileSync(path.join(releaseDir, 'install.bat'), installBatchContent);

  console.log('  ✅ Created start.bat');
  console.log('  ✅ Created help.bat');
  console.log('  ✅ Created install.bat');
  console.log('✅ Batch files created\n');
}

// Generate build report
function generateBuildReport(releaseDir, testOutput) {
  console.log('📊 Generating build report...');
  
  const crypto = require('crypto');
  
  const report = {
    buildInfo: {
      version: config.version,
      buildDate: new Date().toISOString(),
      buildDuration: Math.round((Date.now() - buildStartTime) / 1000),
      buildNumber: process.env.BUILD_NUMBER || 'local',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      gitBranch: process.env.GIT_BRANCH || 'main',
      builder: process.env.USER || process.env.USERNAME || 'unknown',
      platform: process.platform,
      nodeVersion: process.version
    },
    files: {
      executable: 'schemock.exe',
      documentation: 'docs/',
      examples: 'examples/',
      readme: 'README.md',
      versionInfo: 'version.json',
      guides: [
        'BUILD-GUIDE.md',
        'DEPLOYMENT-GUIDE.md',
        'CODE-QUALITY-REPORT.md'
      ]
    },
    testResults: {
      passed: true,
      totalTests: testOutput ? (testOutput.match(/Tests:\s+(\d+)\s+total/)?.[1] || 'unknown') : 'skipped',
      passedTests: testOutput ? (testOutput.match(/(\d+)\s+passed/)?.[1] || 'unknown') : 'skipped',
      coverage: 'See coverage/ directory',
      timestamp: new Date().toISOString()
    },
    checksums: {},
    size: {}
  };

  // Add file checksums and sizes
  const executablePath = path.join(releaseDir, 'schemock.exe');
  if (fs.existsSync(executablePath)) {
    const fileContent = fs.readFileSync(executablePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    report.checksums['schemock.exe'] = hash;
    report.size['schemock.exe'] = `${(fileContent.length / 1024 / 1024).toFixed(2)} MB`;
  }

  // Calculate total release size
  const totalSize = getDirectorySize(releaseDir);
  report.size.total = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;

  fs.writeFileSync(
    path.join(releaseDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('  ✅ build-report.json created');
  console.log(`  ℹ️  Build duration: ${report.buildInfo.buildDuration}s`);
  console.log(`  ℹ️  Total size: ${report.size.total}`);
  console.log('✅ Build report generated\n');
  
  return report;
}

// Helper function to calculate directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        calculateSize(path.join(currentPath, file));
      }
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

// Main build process
function main() {
  try {
    console.log(`\n${'='.repeat(50)}\n`);
    
    cleanBuild();
    compileTypeScript();
    const testOutput = runTests();
    createExecutable();
    
    const releaseDir = createReleaseStructure();
    copyReleaseFiles(releaseDir);
    createVersionInfo(releaseDir);
    createBatchFiles(releaseDir);
    const buildReport = generateBuildReport(releaseDir, testOutput);

    console.log(`${'='.repeat(50)}\n`);
    console.log('🎉 Build completed successfully!\n');
    console.log(`📦 Release package: ${releaseDir}`);
    console.log(`📏 Package size: ${buildReport.size.total}`);
    console.log(`⏱️  Build time: ${buildReport.buildInfo.buildDuration} seconds`);
    console.log(`✅ Checksum: ${buildReport.checksums['schemock.exe']?.substring(0, 16)}...`);
    console.log('\n🚀 Ready for distribution!\n');
    console.log('Next steps:');
    console.log('  1. Test the executable in dist/executable/');
    console.log('  2. Review build-report.json');
    console.log('  3. Package for distribution');
    console.log(`  4. Deploy to production\n`);

  } catch (error) {
    console.error(`\n${'='.repeat(50)}\n`);
    console.error('❌ Build failed!\n');
    console.error(`Error: ${error.message}\n`);
    console.error('Please fix the errors and try again.\n');
    process.exit(1);
  }
}

// Run the build process
if (require.main === module) {
  main();
}

module.exports = { main, config };