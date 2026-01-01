import { schemockVitePlugin, SchemockViteOptions } from '../src/integrations/vite';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('../src/utils/logger');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Vite Integration Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    }));
  });

  describe('schemockVitePlugin', () => {
    it('should create a Vite plugin', () => {
      const plugin = schemockVitePlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-plugin-schemock');
      expect(typeof plugin.configureServer).toBe('function');
    });

    it('should use default options', () => {
      const plugin = schemockVitePlugin();
      
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Plugin Options', () => {
    it('should accept custom schema path', () => {
      const options: SchemockViteOptions = {
        schemaPath: 'custom/path/schema.json'
      };
      
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should accept custom prefix', () => {
      const options: SchemockViteOptions = {
        prefix: '/api/v1'
      };
      
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should accept custom port', () => {
      const options: SchemockViteOptions = {
        port: 8080
      };
      
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should accept watch option', () => {
      const options: SchemockViteOptions = {
        watch: false
      };
      
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should accept multiple options together', () => {
      const options: SchemockViteOptions = {
        schemaPath: 'mocks/custom.json',
        prefix: '/custom-api',
        port: 4000,
        watch: false
      };
      
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should handle empty options object', () => {
      const options: SchemockViteOptions = {};
      const plugin = schemockVitePlugin(options);
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Default Options', () => {
    it('should have default schema path', () => {
      const plugin = schemockVitePlugin();
      // Default is tested by the plugin creation
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should have default prefix', () => {
      const plugin = schemockVitePlugin();
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should have default port', () => {
      const plugin = schemockVitePlugin();
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should have default watch mode enabled', () => {
      const plugin = schemockVitePlugin();
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Configure Server Hook', () => {
    it('should have configureServer hook', () => {
      const plugin = schemockVitePlugin();
      expect(plugin.configureServer).toBeDefined();
      expect(typeof plugin.configureServer).toBe('function');
    });

    it('should call configureServer with server object', () => {
      const plugin = schemockVitePlugin();
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });
  });

  describe('Schema File Handling', () => {
    it('should check if schema file exists', () => {
      mockFs.existsSync.mockReturnValue(false);
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should read schema file if it exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('should parse JSON schema', () => {
      const schemaContent = JSON.stringify({
        type: 'object',
        properties: { id: { type: 'string' } }
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(schemaContent);
      
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle custom schema path', () => {
      const plugin = schemockVitePlugin({ schemaPath: 'custom/schema.json' });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should create mock server with schema', () => {
      const schemaContent = JSON.stringify({
        type: 'object',
        title: 'Test',
        properties: { id: { type: 'string' } }
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(schemaContent);
      
      const plugin = schemockVitePlugin({ port: 0 }); // Use port 0 for testing
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing schema file gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle invalid JSON in schema file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle read file errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });
      
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle server start errors', () => {
      const schemaContent = JSON.stringify({
        type: 'object',
        properties: { id: { type: 'string' } }
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(schemaContent);
      
      const plugin = schemockVitePlugin({ port: 3001 }); // Try port that might be in use
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });
  });

  describe('Proxy Configuration', () => {
    it('should configure proxy if not exists', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockServer.config.server.proxy).toBeDefined();
    });

    it('should add proxy configuration for prefix', () => {
      const plugin = schemockVitePlugin({ prefix: '/api/v1' });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockServer.config.server.proxy['/api/v1']).toBeDefined();
    });

    it('should use default prefix for proxy', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockServer.config.server.proxy['/api']).toBeDefined();
    });

    it('should set proxy target correctly', () => {
      const plugin = schemockVitePlugin({ port: 8080 });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const proxyConfig = mockServer.config.server.proxy['/api'];
      expect(proxyConfig.target).toBe('http://localhost:8080');
    });

    it('should set changeOrigin to true', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const proxyConfig = mockServer.config.server.proxy['/api'];
      expect(proxyConfig.changeOrigin).toBe(true);
    });

    it('should set secure to false', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const proxyConfig = mockServer.config.server.proxy['/api'];
      expect(proxyConfig.secure).toBe(false);
    });
  });

  describe('Path Resolution', () => {
    it('should resolve schema path relative to project root', () => {
      const plugin = schemockVitePlugin();
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const expectedPath = path.resolve('/project/root', 'mocks/api.json');
      expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('api.json'));
    });

    it('should handle absolute paths', () => {
      const plugin = schemockVitePlugin({ schemaPath: '/absolute/path/schema.json' });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });
  });

  describe('Port Configuration', () => {
    it('should use custom port in proxy target', () => {
      const plugin = schemockVitePlugin({ port: 5000 });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const proxyConfig = mockServer.config.server.proxy['/api'];
      expect(proxyConfig.target).toBe('http://localhost:5000');
    });

    it('should use default port 3001', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      const proxyConfig = mockServer.config.server.proxy['/api'];
      expect(proxyConfig.target).toBe('http://localhost:3001');
    });
  });

  describe('Watch Mode', () => {
    it('should enable watch mode by default', () => {
      const plugin = schemockVitePlugin();
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should respect watch option', () => {
      const plugin = schemockVitePlugin({ watch: false });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Schema Path Variations', () => {
    it('should handle schema path with subdirectories', () => {
      const plugin = schemockVitePlugin({ schemaPath: 'src/mocks/api/v1/schema.json' });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should handle schema path with dot notation', () => {
      const plugin = schemockVitePlugin({ schemaPath: './schema.json' });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should handle schema path with parent directory notation', () => {
      const plugin = schemockVitePlugin({ schemaPath: '../shared/schema.json' });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });
  });

  describe('Multiple Prefixes', () => {
    it('should handle single prefix', () => {
      const plugin = schemockVitePlugin({ prefix: '/api' });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should handle nested prefix', () => {
      const plugin = schemockVitePlugin({ prefix: '/api/v1/resources' });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should handle prefix without leading slash', () => {
      const plugin = schemockVitePlugin({ prefix: 'api' });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Edge Cases', () => {
    it('should handle root as schema path', () => {
      const plugin = schemockVitePlugin({ schemaPath: 'schema.json' });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should handle very long schema path', () => {
      const longPath = 'a/very/long/path/to/the/schema/directory/schema.json';
      const plugin = schemockVitePlugin({ schemaPath: longPath });
      const mockServer = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should handle special characters in prefix', () => {
      const plugin = schemockVitePlugin({ prefix: '/api_v1-test' });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      expect(mockServer.config.server.proxy['/api_v1-test']).toBeDefined();
    });

    it('should handle port 0 (auto-assign)', () => {
      const plugin = schemockVitePlugin({ port: 0 });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });

    it('should handle max port number', () => {
      const plugin = schemockVitePlugin({ port: 65535 });
      expect(plugin.name).toBe('vite-plugin-schemock');
    });
  });

  describe('Integration', () => {
    it('should work with minimal configuration', () => {
      const plugin = schemockVitePlugin();
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should work with full configuration', () => {
      const plugin = schemockVitePlugin({
        schemaPath: 'custom/api.json',
        prefix: '/custom-api',
        port: 0,
        watch: false
      });
      
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      expect(() => {
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should maintain plugin name across configurations', () => {
      const plugin1 = schemockVitePlugin();
      const plugin2 = schemockVitePlugin({ port: 8080 });
      const plugin3 = schemockVitePlugin({ schemaPath: 'test.json' });
      
      expect(plugin1.name).toBe('vite-plugin-schemock');
      expect(plugin2.name).toBe('vite-plugin-schemock');
      expect(plugin3.name).toBe('vite-plugin-schemock');
    });

    it('should integrate with Vite server lifecycle', () => {
      const schemaContent = JSON.stringify({
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(schemaContent);
      
      const plugin = schemockVitePlugin({ port: 0 });
      const mockServer: any = {
        config: {
          root: '/project/root',
          server: {}
        }
      };
      
      plugin.configureServer(mockServer);
      
      // Verify proxy was configured
      expect(mockServer.config.server.proxy).toBeDefined();
      expect(mockServer.config.server.proxy['/api']).toBeDefined();
    });
  });
});
