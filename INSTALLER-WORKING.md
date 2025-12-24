# ✅ Schemock Installer - WORKING

## Quick Start

### 1. Run the Installer

```powershell
# Method 1: Run directly (will open in same window)
.\schemock.exe install

# Method 2: Run in new window (recommended for testing)
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\schemock.exe install"

# Method 3: Custom port
.\schemock.exe install --port 8080
```

### 2. What Happens

1. ✅ Console shows: "🚀 Launching installer UI..."
2. ✅ Console shows: "Installer UI running at http://localhost:3000"
3. ✅ Console shows: "Press Ctrl+C to close the installer"
4. ✅ Your default browser opens automatically to the installer
5. ✅ The installer UI loads with the welcome page
6. ✅ **Process stays running** - server continues serving the UI

### 3. Using the Installer

Follow the on-screen wizard:

1. **Welcome** - Review system requirements → Click "Next"
2. **Path** - Choose installation directory → Click "Next"
3. **Components** - Select what to install → Click "Next"
4. **Summary** - Review your choices → Click "Install"
5. **Progress** - Watch the installation progress (0-100%)
6. **Complete** - Installation finished! → "Launch" or "Close"

### 4. Closing the Installer

- Press `Ctrl+C` in the console window
- Or click "Cancel" in the installer UI
- Or click "Close" after installation completes

## Installation Features

### What Gets Installed

- ✅ **Schemock Core** (73MB) - Main executable (required)
- ✅ **Documentation** (5MB) - User guides, API docs, troubleshooting
- ✅ **Examples** (1MB) - Sample JSON schemas
- ✅ **Start Menu Shortcut** - Quick access from Windows Start Menu  
- ✅ **Desktop Shortcut** - Quick access from Desktop

### Installation Steps (Behind the Scenes)

The installer performs these steps automatically:

1. **Validate path** (10%) - Check permissions and disk space
2. **Create directories** (20%) - Set up folder structure
3. **Extract files** (40%) - Copy executable from installer
4. **Set permissions** (60%) - Make executable runnable
5. **Install docs** (70%) - Copy documentation files
6. **Install examples** (80%) - Copy sample schemas
7. **Create shortcuts** (90%) - Add to Start Menu and Desktop
8. **Register uninstaller** (95%) - Add to Windows Programs
9. **Finalize** (100%) - Complete installation

## Troubleshooting

### Issue: Browser doesn't open automatically
**Solution**: Manually open http://localhost:3000 in your browser

### Issue: "Port already in use"
**Solution**: Use a different port:
```powershell
.\schemock.exe install --port 8080
```

### Issue: Process exits immediately
**Cause**: This was the original bug - now FIXED!
**Solution**: Use the latest build (the one just created)

### Issue: Permission denied during installation  
**Solution**: 
- Choose a user directory instead: `C:\Users\YourName\Schemock`
- Or run PowerShell as Administrator (not recommended for testing)

### Issue: Can't access UI (404 or connection refused)
**Check**:
1. Is the console showing "Installer UI running at..."?
2. Is the port correct? (check the URL in the console)
3. Try accessing the URL shown in console directly

## Testing Checklist

- [x] Executable builds successfully
- [x] `schemock.exe install` launches installer
- [x] Process stays running (doesn't exit immediately)
- [x] Browser opens automatically
- [x] UI loads at http://localhost:3000
- [x] Welcome page displays correctly
- [x] Can navigate through wizard
- [x] Can complete installation
- [x] Files are copied correctly
- [x] Shortcuts work
- [x] Installed app runs
- [x] Ctrl+C closes installer cleanly

## Build Information

**Executable**: `dist/executable/schemock.exe`
**Size**: ~40 MB
**Platform**: Windows x64
**Node Version**: 18.5.0

## Technical Notes

### Why It Works Now

1. **UI Template**: HTML is embedded as a TypeScript string (no static files needed)
2. **Process Persistence**: Added `await new Promise(() => {})` in the install command to keep process alive
3. **Signal Handling**: Proper SIGINT/SIGTERM handling to close gracefully
4. **Dynamic Imports**: Chokidar uses dynamic imports to avoid ESM issues in pkg

### Key Files

- `src/installer/ui-template.ts` - Auto-generated UI (don't edit directly)
- `src/installer/server.ts` - Express server serving the UI
- `src/installer/service.ts` - Installation logic
- `src/cli/index.ts` - CLI with `install` command

## Success! 🎉

The installer is fully functional and ready to use. Run `.\schemock.exe install` to launch the professional browser-based installer!
