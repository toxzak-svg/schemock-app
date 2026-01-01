import { createMockServer } from '../index';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { log } from '../utils/logger';

/**
 * Schemock Vite Plugin options
 */
export interface SchemockViteOptions {
  /**
   * Path to the JSON schema file relative to project root
   * @default 'mocks/api.json'
   */
  schemaPath?: string;
  
  /**
   * API prefix to proxy
   * @default '/api'
   */
  prefix?: string;
  
  /**
   * Port to run the mock server on
   * @default 3001
   */
  port?: number;

  /**
   * Whether to enable watch mode for the schema file
   * @default true
   */
  watch?: boolean;
}

/**
 * Schemock Vite Plugin
 * 
 * Automatically starts a Schemock server and proxies requests to it.
 * This makes Schemock the default mock server for Vite-based frontends.
 */
export function schemockVitePlugin(options: SchemockViteOptions = {}) {
  const { 
    schemaPath = 'mocks/api.json', 
    prefix = '/api',
    port = 3001,
    watch = true
  } = options;

  return {
    name: 'vite-plugin-schemock',
    
    // Using configureServer hook to start the mock server when Vite starts
    configureServer(server: any) {
      const absolutePath = resolve(server.config.root, schemaPath);
      
      if (!existsSync(absolutePath)) {
        log.warn(`[Schemock] Schema not found at ${absolutePath}. Skipping mock server setup.`, { module: 'vite-plugin' });
        log.info('💡 Hint: Run `schemock init-vite` to set up the necessary files.');
        return;
      }

      try {
        log.info(`[Schemock] Starting mock server from ${schemaPath}...`, { module: 'vite-plugin' });
        
        const fileContent = readFileSync(absolutePath, 'utf-8');
        const schema = JSON.parse(fileContent);
        
        const mockServer = createMockServer(schema, { 
          port,
          cors: true,
          logLevel: 'info',
          watch
        });
        
        // Start the server
        mockServer.start().catch((err: any) => {
          if (err.code === 'EADDRINUSE') {
            log.error(`[Schemock] Port ${port} is already in use. Try a different port in your vite.config.ts`, { module: 'vite-plugin' });
          } else {
            log.error(`[Schemock] Failed to start: ${err.message}`, { module: 'vite-plugin' });
          }
        });

        // Add proxy configuration to Vite
        // This ensures that any request to /api is forwarded to our mock server
        if (!server.config.server.proxy) {
          server.config.server.proxy = {};
        }

        server.config.server.proxy[prefix] = {
          target: `http://localhost:${port}`,
          changeOrigin: true,
          secure: false
        };

        log.info(`[Schemock] Proxy configured: ${prefix} -> http://localhost:${port}`, { module: 'vite-plugin' });
        log.info(`[Schemock] Interactive playground: http://localhost:${port}/`, { module: 'vite-plugin' });
      } catch (error: any) {
        log.error(`[Schemock] Error in Vite plugin: ${error.message}`, { module: 'vite-plugin' });
      }
    }
  };
}
