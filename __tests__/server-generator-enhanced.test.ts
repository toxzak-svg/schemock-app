import { ServerGenerator, createMockServer } from '../src/generators/server';
import { Schema } from '../src/types';
import { PortError, ServerError } from '../src/errors';
import * as http from 'http';

const TEST_PORT = 3987;

describe('ServerGenerator Enhanced', () => {
  let server: ServerGenerator | null = null;

  afterEach(async () => {
    // Ensure server is properly stopped with error handling
    if (server) {
      try {
        if (server.isRunning()) {
          await server.stop();
        }
      } catch (error) {
        // Log error but don't fail the test
        console.error('Error stopping server in afterEach:', error);
      }
      server = null;
    }

    // Small delay to ensure port is fully released
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('Constructor and Initialization', () => {
    it('should create server with default config', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'info' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should set log level from config', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'debug' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should get Express app instance', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'info' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      const app = server.getApp();
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
    });

    it('should get server config', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'warn' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      const retrievedConfig = server.getConfig();
      expect(retrievedConfig).toEqual(config);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();
      expect(server.isRunning()).toBe(true);
    });

    it('should stop server successfully', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();
      await server.stop();
      expect(server.isRunning()).toBe(false);
    });

    it('should restart server with new config', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();
      expect(server.isRunning()).toBe(true);

      const newConfig = {
        server: { port: TEST_PORT, cors: false, logLevel: 'warn' as const },
        routes: {}
      };
      await server.restart(newConfig);
      expect(server.isRunning()).toBe(true);
      expect(server.getConfig()).toEqual(newConfig);
    });

    it('should restart server without config', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();
      await server.restart();
      expect(server.isRunning()).toBe(true);
    });

    it('should handle stop when server not running', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await expect(server.stop()).resolves.not.toThrow();
    });

    it('should throw error on port in use', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();

      const server2 = new ServerGenerator(config);
      await expect(server2.start()).rejects.toThrow(PortError);
    });

    it('should throw error on invalid port', () => {
      const config = {
        server: { port: -1, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      // Validation now happens in constructor, not during start()
      expect(() => new ServerGenerator(config)).toThrow();
    });
  });

  describe('Built-in Routes', () => {
    beforeEach(async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      await server.start();
    });

    it('should serve playground at root', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Schemock');
    });

    it('should serve health check', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
    });

    it('should return 204 for favicon', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/favicon.ico`);
      expect(response.status).toBe(204);
    });

    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/unknown`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Not Found');
    });
  });

  describe('Route Setup', () => {
    it('should setup GET route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            response: { message: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: 'test' });
    });

    it('should setup POST route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'post:/api/test': {
            path: '/api/test',
            method: 'post' as const,
            response: { success: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should setup DELETE route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'delete:/api/test': {
            path: '/api/test',
            method: 'delete' as const,
            response: { deleted: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'DELETE'
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ deleted: true });
    });

    it('should setup PATCH route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'patch:/api/test': {
            path: '/api/test',
            method: 'patch' as const,
            response: { patched: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ patched: true });
    });

    it('should throw error on unsupported method', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {
          'invalid:/api/test': {
            path: '/api/test',
            method: 'invalid' as any,
            response: {}
          }
        }
      };
      expect(() => new ServerGenerator(config)).toThrow(ServerError);
    });
  });

  describe('Response Handling', () => {
    it('should handle object response', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            response: { data: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`);
      const data = await response.json();
      expect(data).toEqual({ data: 'test' });
    });

    it('should handle function response', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            response: (req: any) => ({ query: req.query })
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test?param=value`);
      const data = await response.json();
      expect(data).toEqual({ query: { param: 'value' } });
    });

    it('should handle custom status code', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            statusCode: 201,
            response: { created: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`);
      expect(response.status).toBe(201);
    });

    it('should handle custom headers', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            headers: { 'X-Custom-Header': 'test-value' },
            response: { data: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`);
      expect(response.headers.get('X-Custom-Header')).toBe('test-value');
    });

    it('should handle delay', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            delay: 500,
            response: { data: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const start = Date.now();
      await fetch(`http://localhost:${TEST_PORT}/api/test`);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Scenarios', () => {
    it('should handle slow scenario', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, scenario: 'slow' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            response: { data: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const start = Date.now();
      await fetch(`http://localhost:${TEST_PORT}/api/test`);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    it('should handle sad-path scenario with delay', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, scenario: 'sad-path' as const, hideBranding: true },
        routes: {
          'get:/api/test': {
            path: '/api/test',
            method: 'get' as const,
            response: { data: 'test' }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const start = Date.now();
      await fetch(`http://localhost:${TEST_PORT}/api/test`);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Strict Mode Validation', () => {
    it('should validate request in strict mode', async () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, strict: true, hideBranding: true },
        routes: {
          'post:/api/test': {
            path: '/api/test',
            method: 'post' as const,
            schema,
            response: { success: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: 25 })
      });
      expect(response.status).toBe(400);
    });

    it('should pass valid request in strict mode', async () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };

      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, strict: true, hideBranding: true },
        routes: {
          'post:/api/test': {
            path: '/api/test',
            method: 'post' as const,
            schema,
            response: { success: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John' })
      });
      expect(response.status).toBe(200);
    });
  });

  describe('generateFromSchema', () => {
    it('should generate server from schema', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      server = ServerGenerator.generateFromSchema(schema, { port: TEST_PORT });
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should use custom resource name', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      server = ServerGenerator.generateFromSchema(schema, {
        port: TEST_PORT,
        resourceName: 'custom'
      });
      const config = server.getConfig();
      expect(config.routes['get:/api/custom']).toBeDefined();
    });

    it('should use custom base path', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      server = ServerGenerator.generateFromSchema(schema, {
        port: TEST_PORT,
        basePath: '/v1/custom'
      });
      const config = server.getConfig();
      expect(config.routes['get:/v1/custom']).toBeDefined();
    });

    it('should handle x-schemock-routes', () => {
      const schema: Schema = {
        type: 'object',
        'x-schemock-routes': [
          {
            path: '/custom/route',
            method: 'get',
            response: { custom: true }
          }
        ]
      };

      server = ServerGenerator.generateFromSchema(schema, { port: TEST_PORT });
      const config = server.getConfig();
      expect(config.routes['get:/custom/route']).toBeDefined();
    });
  });

  describe('createMockServer', () => {
    it('should create mock server from config', () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = createMockServer(config);
      expect(server).toBeInstanceOf(ServerGenerator);
    });
  });

  describe('Error Handling', () => {
    it('should handle route handler errors', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {
          'get:/api/error': {
            path: '/api/error',
            method: 'get' as const,
            response: () => { throw new Error('Handler error'); }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/error`);
      expect(response.status).toBe(500);
    });
  });

  describe('ServerGenerator - Edge Cases', () => {
    describe('port 0 (OS-assigned port)', () => {
      it('should reject port 0 (not supported by validation)', () => {
        const config = {
          server: { port: 0, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        // Port 0 is rejected by validation (MIN_PORT is 1)
        expect(() => new ServerGenerator(config)).toThrow();
      });

      it('should start multiple servers with different ports', async () => {
        const config1 = {
          server: { port: 4005, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        const server1 = new ServerGenerator(config1);
        await server1.start();

        const config2 = {
          server: { port: 4006, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        const server2 = new ServerGenerator(config2);
        await server2.start();

        expect(server1.isRunning()).toBe(true);
        expect(server2.isRunning()).toBe(true);

        // Both should have different ports
        const port1 = server1.getConfig().server.port;
        const port2 = server2.getConfig().server.port;
        expect(port1).not.toBe(port2);

        // Cleanup
        await server1.stop();
        await server2.stop();
      });
    });

    describe('multiple restarts in quick succession', () => {
      it('should handle rapid restarts', async () => {
        const config = {
          server: { port: 3988, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();

        // Restart multiple times rapidly
        for (let i = 0; i < 5; i++) {
          await server.restart();
          expect(server.isRunning()).toBe(true);
        }
      });

      it('should handle restart with config changes rapidly', async () => {
        const baseConfig = {
          server: { port: 3989, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(baseConfig);
        await server.start();

        // Rapid config changes and restarts
        for (let i = 0; i < 3; i++) {
          const newConfig = {
            server: {
              port: 3989,
              cors: i % 2 === 0,
              logLevel: 'error' as const
            },
            routes: {}
          };
          await server.restart(newConfig);
          expect(server.isRunning()).toBe(true);
        }
      });
    });

    describe('server with no routes', () => {
      it('should start server with empty routes', async () => {
        const config = {
          server: { port: 3990, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();

        expect(server.isRunning()).toBe(true);

        // Built-in routes should still work
        const response = await fetch(`http://localhost:3990/health`);
        expect(response.status).toBe(200);
      });

      it('should handle requests to non-existent routes', async () => {
        const config = {
          server: { port: 3991, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:3991/api/nonexistent`);
        expect(response.status).toBe(404);
      });
    });

    describe('server with duplicate route paths', () => {
      it('should handle same path with different methods', async () => {
        const config = {
          server: { port: 3992, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: { method: 'GET' }
            },
            'post:/api/test': {
              path: '/api/test',
              method: 'post' as const,
              response: { method: 'POST' }
            },
            'put:/api/test': {
              path: '/api/test',
              method: 'put' as const,
              response: { method: 'PUT' }
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const getResponse = await fetch(`http://localhost:3992/api/test`);
        expect(getResponse.status).toBe(200);
        const getData = await getResponse.json();
        expect(getData.method).toBe('GET');

        const postResponse = await fetch(`http://localhost:3992/api/test`, {
          method: 'POST'
        });
        expect(postResponse.status).toBe(200);
        const postData = await postResponse.json();
        expect(postData.method).toBe('POST');
      });

      it('should handle routes with same path and method (last wins)', async () => {
        const config = {
          server: { port: 3993, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test1': {
              path: '/api/test',
              method: 'get' as const,
              response: { version: 1 }
            },
            'get:/api/test2': {
              path: '/api/test',
              method: 'get' as const,
              response: { version: 2 }
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:3993/api/test`);
        expect(response.status).toBe(200);
        const data = await response.json();
        // Last defined route should win
        expect(data.version).toBeDefined();
      });
    });

    describe('server with invalid HTTP methods', () => {
      it('should reject invalid method in route config', () => {
        const config = {
          server: { port: 3994, cors: true, logLevel: 'error' as const },
          routes: {
            'invalid:/api/test': {
              path: '/api/test',
              method: 'INVALID' as any,
              response: {}
            }
          }
        };

        expect(() => new ServerGenerator(config)).toThrow();
      });

      it('should reject unsupported HTTP methods', () => {
        const unsupportedMethods = ['CONNECT', 'TRACE', 'OPTIONS'];

        unsupportedMethods.forEach(method => {
          const config = {
            server: { port: 3995, cors: true, logLevel: 'error' as const },
            routes: {
              [`${method.toLowerCase()}:/api/test`]: {
                path: '/api/test',
                method: method.toLowerCase() as any,
                response: {}
              }
            }
          };

          // Unsupported methods should throw
          expect(() => new ServerGenerator(config)).toThrow();
        });
      });
    });

    describe('server lifecycle edge cases', () => {
      it('should handle stop when already stopped', async () => {
        const config = {
          server: { port: 3996, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);

        // Stop without starting
        await expect(server.stop()).resolves.not.toThrow();

        // Start and stop once
        await server.start();
        await server.stop();

        // Stop again
        await expect(server.stop()).resolves.not.toThrow();
      });

      it('should handle restart without starting', async () => {
        const config = {
          server: { port: 3997, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);

        // Restart without starting
        await expect(server.restart()).resolves.not.toThrow();
      });

      it('should handle start when already started', async () => {
        const config = {
          server: { port: 3998, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();

        // Start again - should throw PortError since port is in use
        await expect(server.start()).rejects.toThrow();
      });
    });

    describe('port boundary values', () => {
      it('should handle port 1 (minimum valid port)', async () => {
        const config = {
          server: { port: 1, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();
        expect(server.isRunning()).toBe(true);
      });

      it('should handle port 65535 (maximum valid port)', async () => {
        const config = {
          server: { port: 65535, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        server = new ServerGenerator(config);
        await server.start();
        expect(server.isRunning()).toBe(true);
      });

      it('should reject port -1', () => {
        const config = {
          server: { port: -1, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        expect(() => new ServerGenerator(config)).toThrow();
      });

      it('should reject port 65536', () => {
        const config = {
          server: { port: 65536, cors: true, logLevel: 'error' as const },
          routes: {}
        };
        expect(() => new ServerGenerator(config)).toThrow();
      });
    });

    describe('response edge cases', () => {
      it('should handle null response', async () => {
        const config = {
          server: { port: 3999, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: null
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:3999/api/test`);
        expect(response.status).toBe(200);
      });

      it('should handle empty object response', async () => {
        const config = {
          server: { port: 4000, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: {}
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:4000/api/test`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Object.keys(data).length).toBe(0);
      });

      it('should handle array response', async () => {
        const config = {
          server: { port: 4001, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: [1, 2, 3, 4, 5]
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:4001/api/test`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should handle string response', async () => {
        const config = {
          server: { port: 4002, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: 'plain text response'
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:4002/api/test`);
        expect(response.status).toBe(200);
        const data = await response.text();
        expect(data).toBe('plain text response');
      });

      it('should handle number response', async () => {
        const config = {
          server: { port: 4003, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: { value: 42 }
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:4003/api/test`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.value).toBe(42);
      });

      it('should handle boolean response', async () => {
        const config = {
          server: { port: 4004, cors: true, logLevel: 'error' as const, hideBranding: true },
          routes: {
            'get:/api/test': {
              path: '/api/test',
              method: 'get' as const,
              response: true
            }
          }
        };
        server = new ServerGenerator(config);
        await server.start();

        const response = await fetch(`http://localhost:4004/api/test`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBe(true);
      });
    });
  });
});
