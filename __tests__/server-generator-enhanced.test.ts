import { ServerGenerator, createMockServer } from '../src/generators/server';
import { Schema } from '../src/types';
import { PortError, ServerError } from '../src/errors';
import * as http from 'http';
import * as nodeFetch from 'node-fetch';
const fetch = nodeFetch.default;

const TEST_PORT = 3987;

describe('ServerGenerator Enhanced', () => {
  let server: ServerGenerator | null = null;

  afterEach(async () => {
    if (server && server.isRunning()) {
      await server.stop();
    }
    server = null;
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

    it('should throw error on invalid port', async () => {
      const config = {
        server: { port: -1, cors: true, logLevel: 'error' as const },
        routes: {}
      };
      server = new ServerGenerator(config);
      // Express throws RangeError for invalid ports
      await expect(server.start()).rejects.toThrow();
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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

    it('should setup PUT route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
        routes: {
          'put:/api/test': {
            path: '/api/test',
            method: 'put' as const,
            response: { updated: true }
          }
        }
      };
      server = new ServerGenerator(config);
      await server.start();

      const response = await fetch(`http://localhost:${TEST_PORT}/api/test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ updated: true });
    });

    it('should setup DELETE route', async () => {
      const config = {
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, scenario: 'slow' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, scenario: 'sad-path' as const },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, strict: true },
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
        server: { port: TEST_PORT, cors: true, logLevel: 'error' as const, strict: true },
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
});
