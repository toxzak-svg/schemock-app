import { InstallerService, APP_CONFIG } from '../src/installer/service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock fs, exec, execSync
jest.mock('fs');
jest.mock('child_process');
jest.mock('os');

describe('InstallerService', () => {
  let service: InstallerService;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockOs = os as jest.Mocked<typeof os>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstallerService();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined as any);
    mockFs.writeFileSync.mockReturnValue(undefined as any);
    mockFs.readFileSync.mockReturnValue('test content');
    mockFs.unlinkSync.mockReturnValue(undefined as any);
    mockFs.copyFileSync.mockReturnValue(undefined as any);
    mockFs.statSync.mockReturnValue({
      isDirectory: () => true
    } as any);
    mockFs.readdirSync.mockReturnValue([]);
    
    mockOs.homedir.mockReturnValue('/home/test');
  });

  describe('APP_CONFIG', () => {
    it('should have correct app configuration', () => {
      expect(APP_CONFIG.name).toBe('Schemock');
      expect(APP_CONFIG.version).toBe('1.0.0');
      expect(APP_CONFIG.publisher).toBe('Schemock Team');
      expect(APP_CONFIG.website).toBe('https://github.com/toxzak-svg/schemock-app');
    });

    it('should have system requirements', () => {
      expect(APP_CONFIG.minSystemRequirements).toBeDefined();
      expect(APP_CONFIG.minSystemRequirements.os).toBe('Windows 10 or later');
      expect(APP_CONFIG.minSystemRequirements.ram).toBe('512MB');
      expect(APP_CONFIG.minSystemRequirements.disk).toBe('100MB');
    });
  });

  describe('State Management', () => {
    it('should get initial state', () => {
      const state = service.getState();
      expect(state.currentPage).toBe('welcome');
      expect(state.installPath).toBe('C:\\Program Files\\Schemock');
      expect(state.selectedComponents.core).toBe(true);
      expect(state.selectedComponents.documentation).toBe(true);
      expect(state.selectedComponents.examples).toBe(true);
      expect(state.selectedComponents.startMenu).toBe(true);
      expect(state.selectedComponents.desktopShortcut).toBe(true);
    });

    it('should set install path', () => {
      service.setInstallPath('C:\\Custom\\Path');
      expect(service.getState().installPath).toBe('C:\\Custom\\Path');
    });

    it('should set components', () => {
      service.setComponents({ core: false, examples: false });
      const state = service.getState();
      expect(state.selectedComponents.core).toBe(false);
      expect(state.selectedComponents.examples).toBe(false);
      expect(state.selectedComponents.documentation).toBe(true);
    });

    it('should merge components when setting', () => {
      service.setComponents({ core: false });
      const state = service.getState();
      expect(state.selectedComponents.core).toBe(false);
      expect(state.selectedComponents.documentation).toBe(true);
      expect(state.selectedComponents.examples).toBe(true);
    });
  });

  describe('Installation Process', () => {
    it('should start installation', async () => {
      const result = await service.startInstallation();
      expect(result).toEqual({ success: true });
      expect(service.getState().isInstalling).toBe(true);
    });

    it('should not start installation if already installing', async () => {
      await service.startInstallation();
      const result = await service.startInstallation();
      expect(result).toEqual({ success: true });
      // Should still be true, not restarted
    });

    it('should update progress during installation', async () => {
      await service.startInstallation();
      
      // Wait a bit for progress updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const state = service.getState();
      expect(state.installationProgress).toBeGreaterThan(0);
      expect(state.installLog.length).toBeGreaterThan(0);
    });

    it('should complete installation successfully', async () => {
      // Mock all the installation steps
      mockFs.existsSync.mockImplementation((p: string) => {
        return !p.includes('.write-test');
      });

      await service.startInstallation();

      // Wait for installation to complete
      await new Promise(resolve => setTimeout(resolve, 6000));

      const state = service.getState();
      expect(state.isInstalling).toBe(false);
      expect(state.installationProgress).toBe(100);
      expect(state.error).toBeUndefined();
    });

    it('should handle installation errors', async () => {
      // Make validateInstallationPath throw an error
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await service.startInstallation();

      // Wait for error
      await new Promise(resolve => setTimeout(resolve, 2000));

      const state = service.getState();
      expect(state.isInstalling).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('validateInstallationPath', () => {
    it('should create directory if not exists', async () => {
      mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
        return false;
      });
      mockFs.writeFileSync.mockReturnValue(undefined as any);
      mockFs.unlinkSync.mockReturnValue(undefined as any);

      // Trigger installation to call validateInstallationPath
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });

    it('should test write permissions', async () => {
      mockFs.writeFileSync.mockReturnValue(undefined as any);
      mockFs.unlinkSync.mockReturnValue(undefined as any);

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.write-test'),
        'test'
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('.write-test')
      );
    });
  });

  describe('createInstallationDirectory', () => {
    it('should create docs and examples directories', async () => {
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('extractApplicationFiles', () => {
    it('should copy executable', async () => {
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 4000));

      expect(mockFs.copyFileSync).toHaveBeenCalled();
    });
  });

  describe('installDocumentation', () => {
    it('should skip if documentation not selected', async () => {
      service.setComponents({ documentation: false });
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Should still complete without error
      expect(service.getState().isInstalling).toBe(false);
    });

    it('should copy documentation files', async () => {
      mockFs.existsSync.mockImplementation((p: any) => {
        return String(p).includes('docs') || !String(p).includes('.write-test');
      });

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));
    });
  });

  describe('installExamples', () => {
    it('should skip if examples not selected', async () => {
      service.setComponents({ examples: false });
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(service.getState().isInstalling).toBe(false);
    });

    it('should create example schema file', async () => {
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('examples'),
        expect.stringContaining('user-schema.json')
      );
    });
  });

  describe('createShortcuts', () => {
    it('should skip on non-Windows platforms', async () => {
      // Skip on non-Windows
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should create start menu shortcut if selected', async () => {
      service.setComponents({ startMenu: true });
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Should not throw
      expect(service.getState().isInstalling).toBe(false);
    });

    it('should create desktop shortcut if selected', async () => {
      service.setComponents({ desktopShortcut: true });
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Should not throw
      expect(service.getState().isInstalling).toBe(false);
    });

    it('should skip shortcuts if not selected', async () => {
      service.setComponents({ startMenu: false, desktopShortcut: false });
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(service.getState().isInstalling).toBe(false);
    });
  });

  describe('registerUninstaller', () => {
    it('should skip on non-Windows platforms', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should create uninstall script on Windows', async () => {
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('uninstall.bat'),
        expect.stringContaining('Uninstalling Schemock')
      );
    });
  });

  describe('finalizeInstallation', () => {
    it('should create installation marker', async () => {
      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 6000));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.installation-complete'),
        expect.any(String)
      );
    });
  });

  describe('browsePath', () => {
    it('should return null on error', async () => {
      const { execSync } = require('child_process');
      execSync.mockImplementation(() => {
        throw new Error('Browse failed');
      });

      const result = await service.browsePath();
      expect(result).toBeNull();
    });
  });

  describe('launchApplication', () => {
    it('should launch application', () => {
      const { exec } = require('child_process');
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockReturnValue({} as any);

      service.launchApplication();
      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('copyRecursiveSync', () => {
    it('should copy directory recursively', async () => {
      mockFs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt'] as any);
      mockFs.statSync.mockImplementation((p: any) => ({
        isDirectory: () => !String(p).includes('.txt')
      } as any));

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(mockFs.readdirSync).toHaveBeenCalled();
    });

    it('should copy file', async () => {
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false
      } as any);

      await service.startInstallation();
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(mockFs.copyFileSync).toHaveBeenCalled();
    });
  });
});
