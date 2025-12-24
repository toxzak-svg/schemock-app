const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const log = require('electron-log');

// Installer state
let installerWindow;
let installerState = {
  currentPage: 'welcome',
  installPath: 'C:\\Program Files\\Schemock',
  selectedComponents: {
    core: true,
    documentation: true,
    examples: true,
    startMenu: true,
    desktopShortcut: true
  },
  installationProgress: 0,
  isInstalling: false,
  installLog: []
};

// Application configuration
const APP_CONFIG = {
  name: 'Schemock',
  version: '1.0.0',
  publisher: 'Schemock Team',
  website: 'https://github.com/yourusername/schemock',
  minSystemRequirements: {
    os: 'Windows 10 or later',
    ram: '512MB',
    disk: '100MB',
    architecture: 'x64'
  }
};

// System requirements validation
function validateSystemRequirements() {
  const os = require('os');
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: Math.round(os.totalmem() / 1024 / 1024) + 'MB'
  };

  return {
    valid: systemInfo.platform === 'win32' && systemInfo.arch === 'x64',
    details: systemInfo
  };
}

// Installation functions
async function performInstallation() {
  installerState.isInstalling = true;
  installerState.installationProgress = 0;
  installerState.installLog = [];

  try {
    // Step 1: Validate installation path
    await updateProgress(10, 'Validating installation path...');
    await validateInstallationPath();

    // Step 2: Create installation directory
    await updateProgress(20, 'Creating installation directory...');
    await createInstallationDirectory();

    // Step 3: Extract and copy files
    await updateProgress(40, 'Extracting application files...');
    await extractApplicationFiles();

    // Step 4: Install main executable
    await updateProgress(60, 'Installing main executable...');
    await installExecutable();

    // Step 5: Install documentation
    await updateProgress(70, 'Installing documentation...');
    await installDocumentation();

    // Step 6: Install examples
    await updateProgress(80, 'Installing examples...');
    await installExamples();

    // Step 7: Create shortcuts
    await updateProgress(90, 'Creating shortcuts...');
    await createShortcuts();

    // Step 8: Register for uninstallation
    await updateProgress(95, 'Registering uninstaller...');
    await registerUninstaller();

    // Step 9: Finalize installation
    await updateProgress(100, 'Finalizing installation...');
    await finalizeInstallation();

    installerState.isInstalling = false;
    return true;

  } catch (error) {
    installerState.isInstalling = false;
    installerState.installLog.push(`ERROR: ${error.message}`);
    log.error('Installation failed:', error);
    return false;
  }
}

async function updateProgress(progress, message) {
  installerState.installationProgress = progress;
  installerState.installLog.push(`[${progress}%] ${message}`);
  
  if (installerWindow) {
    installerWindow.webContents.send('installation-progress', { progress, message });
  }
  
  // Simulate delay for visual effect
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function validateInstallationPath() {
  if (!fs.existsSync(installerState.installPath)) {
    await fs.ensureDir(installerState.installPath);
  }
  
  const testPath = path.join(installerState.installPath, '.write-test');
  await fs.writeFile(testPath, 'test');
  await fs.remove(testPath);
}

async function createInstallationDirectory() {
  await fs.ensureDir(installerState.installPath);
  await fs.ensureDir(path.join(installerState.installPath, 'docs'));
  await fs.ensureDir(path.join(installerState.installPath, 'examples'));
}

async function extractApplicationFiles() {
  const sourceDir = path.join(__dirname, '../../releases/schemock-1.0.0');
  const targetDir = installerState.installPath;

  // Copy executable
  const exeSource = path.join(sourceDir, 'schemock.exe');
  const exeTarget = path.join(targetDir, 'schemock.exe');
  await fs.copy(exeSource, exeTarget);

  // Copy batch files
  const batchFiles = ['start.bat', 'help.bat'];
  for (const file of batchFiles) {
    const source = path.join(sourceDir, file);
    const target = path.join(targetDir, file);
    if (await fs.pathExists(source)) {
      await fs.copy(source, target);
    }
  }
}

async function installExecutable() {
  // Set executable permissions
  const exePath = path.join(installerState.installPath, 'schemock.exe');
  await fs.chmod(exePath, 0o755);
}

async function installDocumentation() {
  if (!installerState.selectedComponents.documentation) return;

  const sourceDocs = path.join(__dirname, '../../releases/schemock-1.0.0/docs');
  const targetDocs = path.join(installerState.installPath, 'docs');
  
  if (await fs.pathExists(sourceDocs)) {
    await fs.copy(sourceDocs, targetDocs);
  }
}

async function installExamples() {
  if (!installerState.selectedComponents.examples) return;

  const sourceExamples = path.join(__dirname, '../../releases/schemock-1.0.0/examples');
  const targetExamples = path.join(installerState.installPath, 'examples');
  
  if (await fs.pathExists(sourceExamples)) {
    await fs.copy(sourceExamples, targetExamples);
  }
}

async function createShortcuts() {
  const { execSync } = require('child_process');
  
  if (installerState.selectedComponents.startMenu) {
    const startMenuPath = path.join(process.env.APPDATA, 'Microsoft/Windows/Start Menu/Programs/Schemock');
    await fs.ensureDir(startMenuPath);
    
    const shortcutTarget = path.join(installerState.installPath, 'schemock.exe');
    const shortcutPath = path.join(startMenuPath, 'Schemock.lnk');
    
    // Create start menu shortcut
    const shortcutScript = `
      $WshShell = New-Object -comObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
      $Shortcut.TargetPath = "${shortcutTarget}"
      $Shortcut.WorkingDirectory = "${installerState.installPath}"
      $Shortcut.Save()
    `;
    
    await fs.writeFile(path.join(startMenuPath, 'create-shortcut.ps1'), shortcutScript);
    execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(startMenuPath, 'create-shortcut.ps1')}"`, { cwd: startMenuPath });
  }
  
  if (installerState.selectedComponents.desktopShortcut) {
    const desktopPath = path.join(process.env.USERPROFILE, 'Desktop');
    const shortcutTarget = path.join(installerState.installPath, 'schemock.exe');
    const shortcutPath = path.join(desktopPath, 'Schemock.lnk');
    
    const shortcutScript = `
      $WshShell = New-Object -comObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
      $Shortcut.TargetPath = "${shortcutTarget}"
      $Shortcut.WorkingDirectory = "${installerState.installPath}"
      $Shortcut.IconLocation = "${shortcutTarget}"
      $Shortcut.Save()
    `;
    
    await fs.writeFile(path.join(desktopPath, 'create-schemock-shortcut.ps1'), shortcutScript);
    execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(desktopPath, 'create-schemock-shortcut.ps1')}"`, { cwd: desktopPath });
  }
}

async function registerUninstaller() {
  const { execSync } = require('child_process');
  
  // Add to Programs and Features
  const uninstallScript = `
    @echo off
    echo Uninstalling Schemock...
    taskkill /F /IM schemock.exe 2>nul
    timeout /t 2 /nobreak >nul
    rmdir /s /q "${installerState.installPath}"
    rmdir /s /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Schemock" 2>nul
    del /f /q "%USERPROFILE%\\Desktop\\Schemock.lnk" 2>nul
    echo Schemock has been uninstalled.
    pause
  `;
  
  const uninstallerPath = path.join(installerState.installPath, 'uninstall.bat');
  await fs.writeFile(uninstallerPath, uninstallScript);
  
  // Add registry entry
  const registryScript = `
    $RegPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Schemock"
    New-Item -Path $RegPath -Force
    New-ItemProperty -Path $RegPath -Name "DisplayName" -Value "Schemock" -PropertyType String -Force
    New-ItemProperty -Path $RegPath -Name "UninstallString" -Value "${uninstallerPath}" -PropertyType String -Force
    New-ItemProperty -Path $RegPath -Name "InstallLocation" -Value "${installerState.installPath}" -PropertyType String -Force
    New-ItemProperty -Path $RegPath -Name "DisplayVersion" -Value "${APP_CONFIG.version}" -PropertyType String -Force
    New-ItemProperty -Path $RegPath -Name "Publisher" -Value "${APP_CONFIG.publisher}" -PropertyType String -Force
  `;
  
  await fs.writeFile(path.join(installerState.installPath, 'register-uninstall.ps1'), registryScript);
  execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(installerState.installPath, 'register-uninstall.ps1')}"`, { cwd: installerState.installPath });
}

async function finalizeInstallation() {
  // Create installation complete marker
  const markerPath = path.join(installerState.installPath, '.installation-complete');
  await fs.writeFile(markerPath, new Date().toISOString());
  
  installerState.installLog.push('Installation completed successfully!');
}

// IPC Handlers
ipcMain.handle('get-app-config', () => APP_CONFIG);
ipcMain.handle('get-installer-state', () => installerState);
ipcMain.handle('set-install-path', (event, installPath) => {
  installerState.installPath = installPath;
});

ipcMain.handle('set-components', (event, components) => {
  installerState.selectedComponents = { ...installerState.selectedComponents, ...components };
});

ipcMain.handle('navigate-to', (event, page) => {
  installerState.currentPage = page;
  if (installerWindow) {
    installerWindow.webContents.send('navigate-to', page);
  }
});

ipcMain.handle('start-installation', async () => {
  const result = await performInstallation();
  if (installerWindow) {
    installerWindow.webContents.send('installation-complete', { success: result });
  }
  return result;
});

ipcMain.handle('validate-system-requirements', () => {
  return validateSystemRequirements();
});

ipcMain.handle('browse-install-path', async () => {
  const result = await dialog.showOpenDialog(installerWindow, {
    properties: ['openDirectory'],
    title: 'Select Installation Directory'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('show-message-box', async (event, { type, title, message, buttons }) => {
  const result = await dialog.showMessageBox(installerWindow, {
    type: type || 'info',
    title: title || 'Schemock Installer',
    message: message || '',
    buttons: buttons || ['OK'],
    defaultId: 0
  });
  return result;
});

// Window creation
function createInstallerWindow() {
  installerWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    maxWidth: 800,
    maxHeight: 600,
    resizable: false,
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  });

  installerWindow.setMenu(null);
  installerWindow.setTitle('Schemock Installer');

  installerWindow.on('closed', () => {
    installerWindow = null;
    if (installerState.isInstalling) {
      log.warn('Installer closed during installation');
      app.quit();
    }
  });

  // Load the installer UI
  installerWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    installerWindow.webContents.openDevTools();
  }
}

// App event handlers
app.whenReady().then(() => {
  // Validate system requirements before starting
  const validation = validateSystemRequirements();
  if (!validation.valid) {
    dialog.showErrorBox('System Requirements Not Met', 
      `Schemock requires ${APP_CONFIG.minSystemRequirements.os} (${APP_CONFIG.minSystemRequirements.architecture})\\n\\nYour system: ${validation.details.platform} ${validation.details.arch}\\n\\nPlease upgrade your system and try again.`);
    app.quit();
    return;
  }

  createInstallerWindow();
});

app.on('window-all-closed', () => {
  if (installerState.isInstalling) return;
  app.quit();
});

app.on('before-quit', () => {
  log.info('Installer application closing');
});

// Handle command line arguments for silent installation
const args = process.argv.slice(2);
const isSilent = args.includes('/S') || args.includes('--silent');

if (isSilent) {
  log.info('Starting silent installation');
  // Perform silent installation here
  performInstallation().then(success => {
    if (success) {
      log.info('Silent installation completed successfully');
      process.exit(0);
    } else {
      log.error('Silent installation failed');
      process.exit(1);
    }
  });
}