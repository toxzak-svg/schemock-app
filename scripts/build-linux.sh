#!/bin/bash

# Build script for Linux distribution
set -e

echo "🐧 Building Linux Distribution for Schemock"

VERSION=$(node -p "require('../package.json').version")
echo "📦 Version: $VERSION"

# Create release directory
mkdir -p releases/schemock-${VERSION}/linux

# Copy Linux executable
echo "📦 Copying Linux executable..."
if [ -f "dist/executable/schemock-linux" ]; then
    cp dist/executable/schemock-linux releases/schemock-${VERSION}/schemock
    chmod +x releases/schemock-${VERSION}/schemock
    echo "✅ Linux executable copied and made executable"
elif [ -f "dist/executable/schemock-linux-x64" ]; then
    cp dist/executable/schemock-linux-x64 releases/schemock-${VERSION}/schemock
    chmod +x releases/schemock-${VERSION}/schemock
    echo "✅ Linux executable copied and made executable"
else
    echo "❌ Linux executable not found in dist/executable/"
    exit 1
fi

# Create examples directory
echo "📁 Creating examples directory..."
mkdir -p releases/schemock-${VERSION}/examples

# Create example schemas
cat > releases/schemock-${VERSION}/examples/user-schema.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Example",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 120 }
  },
  "required": ["id", "name", "email"]
}
EOF

cat > releases/schemock-${VERSION}/examples/product-schema.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product Example",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "price": { "type": "number", "minimum": 0 },
    "category": { "type": "string", "enum": ["electronics", "clothing", "books"] }
  },
  "required": ["id", "name", "price", "category"]
}
EOF

# Create start script
echo "📜 Creating start script..."
cat > releases/schemock-${VERSION}/start.sh << 'EOF'
#!/bin/bash

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

./schemock start "$SCHEMA_FILE" "$@"
EOF

chmod +x releases/schemock-${VERSION}/start.sh

# Create install script
echo "📜 Creating install script..."
cat > releases/schemock-${VERSION}/install.sh << 'EOF'
#!/bin/bash

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

# Copy executable
echo "📦 Copying executable..."
cp schemock "$INSTALL_DIR/schemock"
chmod +x "$INSTALL_DIR/schemock"

# Check if INSTALL_DIR is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "⚠️  Warning: $INSTALL_DIR is not in your PATH"
    echo ""
    echo "Add this to your shell configuration (~/.bashrc, ~/.zshrc, etc.):"
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
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
EOF

chmod +x releases/schemock-${VERSION}/install.sh

# Create README for Linux
cat > releases/schemock-${VERSION}/README-LINUX.md << EOF
# Schemock v${VERSION} - Linux Distribution

## 🐧 Linux Installation

### Quick Start

\`\`\`bash
# Make the script executable
chmod +x start.sh

# Start with example schema
./start.sh examples/user-schema.json --port 3000
\`\`\`

### System Installation

\`\`\`bash
# Run the install script
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
# Copy executable to your preferred location
cp schemock /usr/local/bin/
chmod +x /usr/local/bin/schemock
\`\`\`

## Usage Examples

\`\`\`bash
# Start with schema file
./schemock start examples/user-schema.json

# Specify port
./schemock start examples/product-schema.json --port 8080

# Enable watch mode
./schemock start examples/user-schema.json --watch

# Enable CORS
./schemock start examples/user-schema.json --cors

# Log level
./schemock start examples/user-schema.json --log-level debug
\`\`\`

## Quick Start with Start Script

\`\`\`bash
# See help
./start.sh

# Start with example
./start.sh examples/user-schema.json

# With options
./start.sh examples/user-schema.json --port 3000 --log-level info
\`\`\`

## System Requirements

- **OS**: Linux (x64)
- **Kernel**: 3.10 or higher
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Disk**: 50MB free space
- **Dependencies**: None (standalone binary)

## Uninstalling

If installed via install script:

\`\`\`bash
# Remove executable
sudo rm /usr/local/bin/schemock

# Or for user installation:
rm ~/.local/bin/schemock
\`\`\`

## Troubleshooting

### Permission Denied

\`\`\`bash
chmod +x schemock
\`\`\`

### Cannot Execute

\`\`\`bash
# For 64-bit systems
./schemock --help
\`\`\`

### Port Already in Use

\`\`\`bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
./schemock start schema.json --port 3001
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
Build Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo ""
echo "✅ Linux distribution prepared successfully!"
echo ""
echo "📁 Distribution location: releases/schemock-${VERSION}/linux/"
echo ""
echo "📦 Files created:"
ls -lh releases/schemock-${VERSION}/
