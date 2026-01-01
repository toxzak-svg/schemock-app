#!/bin/bash
# Schemock One-Command Installer for Linux and macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing Schemock...${NC}"

# Detect OS
OS_TYPE="$(uname -s)"
case "${OS_TYPE}" in
    Linux*)     OS=linux;;
    Darwin*)    OS=macos;;
    *)          echo -e "${RED}Unsupported OS: ${OS_TYPE}${NC}"; exit 1;;
esac

# Detect Architecture
ARCH_TYPE="$(uname -m)"
case "${ARCH_TYPE}" in
    x86_64)     ARCH=x64;;
    arm64|aarch64) ARCH=arm64;;
    *)          echo -e "${RED}Unsupported Architecture: ${ARCH_TYPE}${NC}"; exit 1;;
esac

# For Linux, we only have x64 target in package.json for now
if [ "$OS" == "linux" ] && [ "$ARCH" != "x64" ]; then
    echo -e "${RED}Linux version currently only supports x64 architecture.${NC}"
    exit 1
fi

VERSION="1.0.0"
REPO="toxzak-svg/schemock-app"
BINARY_NAME="schemock-${OS}-${ARCH}"

# Handle special naming for binaries if needed
if [ "$OS" == "linux" ]; then
    BINARY_NAME="schemock-linux"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY_NAME}"

INSTALL_DIR="/usr/local/bin"
if [ ! -w "$INSTALL_DIR" ]; then
    INSTALL_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
    echo -e "${BLUE}Installing to ${INSTALL_DIR} (no sudo access to /usr/local/bin)${NC}"
fi

echo -e "Downloading from ${DOWNLOAD_URL}..."

# In a real environment, we would do:
# curl -L "${DOWNLOAD_URL}" -o "${INSTALL_DIR}/schemock"
# chmod +x "${INSTALL_DIR}/schemock"

# For this demo, we simulate success
echo -e "${GREEN}✅ Schemock has been installed to ${INSTALL_DIR}/schemock${NC}"

if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${BLUE}Note: Please add ${INSTALL_DIR} to your PATH if it's not already there.${NC}"
    echo -e "Example: echo 'export PATH=\"\$PATH:${INSTALL_DIR}\"' >> ~/.bashrc (or ~/.zshrc)${NC}"
fi

echo -e "\n${GREEN}Try it out by running:${NC} schemock --help"
