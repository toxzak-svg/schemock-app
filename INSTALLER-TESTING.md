# Installer Testing Guide

## Testing the Installer

### 1. Build the Executable

```bash
npm run build:exe
```

The executable will be created at: `dist/executable/schemock.exe`

### 2. Test the Installer Command

```bash
# Navigate to the executable directory
cd dist/executable

# Launch the installer
.\schemock.exe install
```

### 3. What Should Happen

1. ✅ Console shows: "🚀 Launching installer UI..."
2. ✅ Console shows: "Installer UI running at http://localhost:3000"
3. ✅ Your default browser opens automatically
4. ✅ The installer UI loads with the welcome page

### 4. Test the Installation Workflow

#### Step 1: Welcome Page
- Verify system requirements are displayed
- Click "Next"

#### Step 2: Installation Path
- Default path should be: `C:\Program Files\Schemock`
- Click "Browse..." to test folder selection
- Verify available space is shown
- Click "Next"

#### Step 3: Component Selection
- All components should be checked by default:
  - ✅ Schemock Core Application (required, disabled)
  - ✅ Documentation
  - ✅ Example Schemas
  - ✅ Start Menu Shortcuts
  - ✅ Desktop Shortcut
- Uncheck/recheck components to test
- Click "Next"

#### Step 4: Summary
- Verify installation details are correct
- Click "Install"

#### Step 5: Installation Progress
- Progress bar should update from 0% to 100%
- Messages should show each installation step:
  - Validating installation path...
  - Creating installation directory...
  - Extracting application files...
  - Installing main executable...
  - Installing documentation...
  - Installing examples...
  - Creating shortcuts...
  - Registering uninstaller...
  - Finalizing installation...

#### Step 6: Success
- ✅ Success message displayed
- Two buttons available:
  - "Launch Schemock" - Opens the installed application
  - "Close" - Closes the installer

### 5. Verify Installation Results

After installation completes, check:

```bash
# Check installation directory exists
dir "C:\Program Files\Schemock"

# Should contain:
# - schemock.exe
# - docs/ (if selected)
# - examples/ (if selected)
# - uninstall.bat
# - .installation-complete
```

#### Check Start Menu
1. Press Windows key
2. Type "Schemock"
3. Shortcut should appear (if selected)

#### Check Desktop
- Desktop should have a "Schemock" shortcut (if selected)

### 6. Test the Installed Application

```bash
cd "C:\Program Files\Schemock"
.\schemock.exe --help
```

Should display the help menu.

### 7. Test Uninstallation

```bash
cd "C:\Program Files\Schemock"
.\uninstall.bat
```

Should remove:
- Installation directory
- Start Menu shortcuts
- Desktop shortcuts

### 8. Troubleshooting

#### Issue: Browser doesn't open
**Solution**: Manually navigate to `http://localhost:3000`

#### Issue: Port already in use
**Solution**: Use a different port:
```bash
.\schemock.exe install --port 8080
```

#### Issue: Permission denied during installation
**Solution**: 
- Choose a different installation directory (e.g., `C:\Users\YourName\Schemock`)
- Or run as Administrator (not recommended for testing)

#### Issue: Installer UI doesn't load
**Check**:
1. Console output for errors
2. Browser console (F12) for errors
3. Try accessing directly: `http://localhost:3000`

#### Issue: Installation fails
**Check**:
1. Sufficient disk space
2. Write permissions for selected directory
3. Anti-virus software isn't blocking

### 9. Advanced Testing

#### Test Custom Port
```bash
.\schemock.exe install --port 5000
```

#### Test Multiple Installations
- Install to different directories
- Verify shortcuts don't conflict

#### Test Component Combinations
- Install with only core + docs
- Install with only core + examples
- Install with all components
- Install with minimal components

### 10. Known Limitations

- Requires Windows 10 or later (x64)
- Requires a modern web browser
- Installation directory must be writable
- Browser must not block localhost connections

## Quick Test Checklist

- [ ] Executable builds successfully
- [ ] `schemock.exe install` launches UI
- [ ] Browser opens automatically
- [ ] Welcome page displays correctly
- [ ] Path selection works
- [ ] Browse button opens folder picker
- [ ] Component selection toggles work
- [ ] Summary shows correct information
- [ ] Installation progresses 0-100%
- [ ] All installation steps complete
- [ ] Success page displays
- [ ] Files are copied to installation directory
- [ ] Shortcuts are created (if selected)
- [ ] Installed app runs correctly
- [ ] Uninstaller works

## Success Criteria

✅ All checklist items complete
✅ No errors in console
✅ No errors in browser console  
✅ Installation completes in under 2 minutes
✅ Installed application is functional
✅ Uninstall removes all traces
