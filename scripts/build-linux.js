#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐧 Building Linux Distribution for Schemock');

const packageJson = require('../package.json');
const VERSION = packageJson.version;

console.log(`📦 Version: ${VERSION}`);

// Create release directory
const linuxDir = path.join('releases', `schemock-${VERSION}`, 'linux');
fs.mkdirSync(linuxDir, { recursive: true });

console.log(`📁 Created directory: ${linuxDir}`);

// Create package.json for Linux distribution
const linuxPackageJson = {
  name: 'schemock-linux',
  version: VERSION,
  description: 'Mock Server Generator for Linux',
  bin: {
    schemock: './dist/index.js'
  },
  scripts: {
    start: 'node dist/index.js'
  },
  dependencies: packageJson.dependencies,
  engines: {
    node: '>=18.0.0'
  },
  os: ['linux'],
  cpu: ['x64']
};

fs.writeFileSync(
  path.join(linuxDir, 'package.json'),
  JSON.stringify(linuxPackageJson, null, 2)
);

console.log('✅ Created package.json');

// Copy dist folder
const distSource = path.join(__dirname, '../dist');
const distTarget = path.join(linuxDir, 'dist');

if (fs.existsSync(distSource)) {
  copyRecursive(distSource, distTarget);
  console.log('✅ Copied dist folder');
} else {
  console.log('❌ dist folder not found. Run "npm run build" first.');
}

// Create examples directory
const examplesDir = path.join(linuxDir, 'examples');
fs.mkdirSync(examplesDir, { recursive: true });

// Create example schemas
const userSchema = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
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
  '$schema': 'http://json-schema.org/draft-07/schema#',
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

console.log('✅ Created examples');

// Create start script
const startScript = `#!/bin/bash

# Schemock Mock Server - Quick Start Script

# Check if schema file is provided
if [ $# -eq 0 ]; then
    echo "🚀 Schemock Mock Server Generator"
    echo ""
    echo "Usage: ./start.sh <schema-file> [options]"
    echo ""
    echo "Example: ./start.sh examples/user-schema.json --port 3000"
    echo ""
    echo "Quick start with example:"
    echo "  ./start.sh examples/user-schema.json"
    exit 1
fi

# Get schema file
SCHEMA_FILE=$1
shift

# Check if file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file '$SCHEMA_FILE' not found"
    exit 1
fi

# Run schemock
echo "🚀 Starting Schemock Mock Server..."
echo "📄 Schema: $SCHEMA_FILE"
echo "📦 Options: $@"
echo ""

node dist/index.js start "$SCHEMA_FILE" "$@"
`;

fs.writeFileSync(path.join(linuxDir, 'start.sh'), startScript);
console.log('✅ Created start.sh');

// Create install script
const installScript = `#!/bin/bash

# Schemock Installation Script for Linux

set -e

echo "🐧 Installing Schemock Mock Server Generator"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    INSTALL_DIR="/usr/local/bin"
    echo "🔧 Installing system-wide to $INSTALL_DIR"
else
    INSTALL_DIR="$HOME/.local/bin"
    echo "🔧 Installing to $INSTALL_DIR"
    
    # Create directory if it doesn't exist
    mkdir -p "$INSTALL_DIR"
fi

# Copy executable script
cat > "$INSTALL_DIR/schemock" << 'EOF'
#!/bin/bash
node $(dirname "$0")/../lib/node_modules/schemock-linux/dist/index.js "$@"
EOF

chmod +x "$INSTALL_DIR/schemock"

# Check if INSTALL_DIR is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "⚠️  Warning: $INSTALL_DIR is not in your PATH"
    echo ""
    echo "Add this to your shell configuration (~/.bashrc, ~/.zshrc, etc.):"
    echo "  export PATH=\"\\$PATH:$INSTALL_DIR\""
    echo ""
    echo "Then run: source ~/.bashrc  (or ~/.zshrc)"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "To verify installation:"
echo "  schemock --version"
echo ""
echo "To start a mock server:"
echo "  schemock start your-schema.json"
`;

fs.writeFileSync(path.join(linuxDir, 'install.sh'), installScript);
console.log('✅ Created install.sh');

// Create README for Linux
const readme = `# Schemock v${VERSION} - Linux Distribution

## 🐧 Linux Installation

### Quick Start

\`\`\`bash
# Make script executable
chmod +x start.sh

# Start with example schema
./start.sh examples/user-schema.json --port 3000
\`\`\`

### System Installation

\`\`\`bash
# Run install script
chmod +x install.sh
./install.sh
\`\`\`

After installation, you can use \`schemock\` from anywhere:

\`\`\`bash
schemock --version
schemock start path/to/schema.json
\`\`\`

### Manual Installation

\`\`\`bash
# Install dependencies
npm install

# Run directly
node dist/index.js start examples/user-schema.json
\`\`\`

## Usage Examples

\`\`\`bash
# Start with schema file
./start.sh examples/user-schema.json

# Specify port
./start.sh examples/product-schema.json --port 8080

# Enable watch mode
./start.sh examples/user-schema.json --watch

# Enable CORS
./start.sh examples/user-schema.json --cors

# Log level
./start.sh examples/user-schema.json --log-level debug
\`\`\`

## System Requirements

- **OS**: Linux (x64)
- **Node.js**: 18.0.0 or higher
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Disk**: 50MB free space

## Quick Start with Start Script

\`\`\`bash
# See help
./start.sh

# Start with example
./start.sh examples/user-schema.json

# With options
./start.sh examples/user-schema.json --port 3000 --log-level info
\`\`\`

## Documentation

- Full documentation: [https://github.com/toxzak-svg/schemock-app](https://github.com/toxzak-svg/schemock-app)
- Examples: See \`examples/\` directory

## Support

- Issues: [GitHub Issues](https://github.com/toxzak-svg/schemock-app/issues)
- Discussions: [GitHub Discussions](https://github.com/toxzak-svg/schemock-app/discussions)

---

Version: ${VERSION}
Platform: Linux x64
Build Date: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(linuxDir, 'README-LINUX.md'), readme);
console.log('✅ Created README-LINUX.md');

// Create tarball
console.log('\n📦 Creating distribution tarball...');
const tarballName = `schemock-${VERSION}-linux-x64.tar.gz`;
const tarballPath = path.join('releases', tarballName);

try {
  execSync(`tar -czf "${tarballPath}" -C releases schemock-${VERSION}/linux`, {
    stdio: 'inherit',
    cwd: path.dirname(linuxDir)
  });
  console.log(`✅ Created tarball: ${tarballPath}`);
} catch (error) {
  console.log('⚠️  Could not create tarball (tar not available on Windows)');
  console.log(`   You can manually package: releases/schemock-${VERSION}/linux/`);
}

console.log('\n✅ Linux distribution prepared successfully!');
console.log(`\n📁 Distribution location: ${linuxDir}`);
console.log('\n📦 Files created:');
listFiles(linuxDir);

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function listFiles(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      console.log(`${prefix}📁 ${item}/`);
      listFiles(itemPath, prefix + '  ');
    } else {
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`${prefix}📄 ${item} (${sizeKB} KB)`);
    }
  });
}

console.log('\n🎉 Linux distribution complete!');
