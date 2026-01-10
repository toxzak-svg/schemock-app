/**
 * Tests for the Schemocker MCP Server
 */

import { SchemockerMCPServer } from '../src/mcp-server/index';
import { SchemockerMCPConfig } from '../src/mcp-server/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SchemockerMCPServer', () => {
  let server: SchemockerMCPServer;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default base URL when not provided', () => {
      server = new SchemockerMCPServer({});
      // Server is created without errors
      expect(server).toBeInstanceOf(SchemockerMCPServer);
    });

    it('should use custom base URL when provided', () => {
      const config: SchemockerMCPConfig = {
        baseUrl: 'http://localhost:4000',
      };
      server = new SchemockerMCPServer(config);
      expect(server).toBeInstanceOf(SchemockerMCPServer);
    });

    it('should use custom timeout when provided', () => {
      const config: SchemockerMCPConfig = {
        timeout: 15000,
      };
      server = new SchemockerMCPServer(config);
      expect(server).toBeInstanceOf(SchemockerMCPServer);
    });
  });

  describe('Tool Handlers', () => {
    let mockServer: any;

    beforeEach(() => {
      server = new SchemockerMCPServer({});
      // Access internal server instance for testing
      mockServer = (server as any).server;
    });

    describe('list_routes', () => {
      it('should list routes from Schemocker routes endpoint', async () => {
        const mockRoutes = [
          { method: 'GET', path: '/api/users', description: 'List users' },
          { method: 'POST', path: '/api/users', description: 'Create user' },
        ];

        mockedAxios.get.mockResolvedValueOnce({
          data: { routes: mockRoutes },
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'list_routes',
          arguments: { includeExamples: true },
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/__schemock/routes'),
          expect.any(Object)
        );
      });

      it('should fall back to schema-based discovery when routes endpoint fails', async () => {
        const mockSchema = {
          title: 'User',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
          },
        };

        mockedAxios.get
          .mockRejectedValueOnce(new Error('Routes endpoint not found'))
          .mockResolvedValueOnce({ data: mockSchema });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'list_routes',
          arguments: {},
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/__schemock/schema'),
          expect.any(Object)
        );
      });
    });

    describe('call_endpoint', () => {
      it('should make GET request to endpoint', async () => {
        const mockResponse = { data: { id: '123', name: 'Test User' } };
        mockedAxios.get.mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: mockResponse,
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'call_endpoint',
          arguments: {
            method: 'GET',
            path: '/api/users',
          },
        });

        expect(mockedAxios.get).toHaveBeenCalled();
      });

      it('should make POST request with body', async () => {
        const requestBody = { name: 'New User', email: 'test@example.com' };
        const mockResponse = { success: true };

        mockedAxios.post.mockResolvedValueOnce({
          status: 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' },
          data: mockResponse,
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'call_endpoint',
          arguments: {
            method: 'POST',
            path: '/api/users',
            body: requestBody,
          },
        });

        expect(mockedAxios.post).toHaveBeenCalled();
      });

      it('should include query parameters in request', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: { users: [] },
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'call_endpoint',
          arguments: {
            method: 'GET',
            path: '/api/users',
            query: { limit: 10, offset: 0 },
          },
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: { limit: 10, offset: 0 },
          })
        );
      });

      it('should handle error responses', async () => {
        const errorResponse = {
          response: {
            status: 404,
            statusText: 'Not Found',
            headers: { 'content-type': 'application/json' },
            data: { error: 'User not found' },
          },
        };

        mockedAxios.get.mockRejectedValueOnce(errorResponse);

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'call_endpoint',
          arguments: {
            method: 'GET',
            path: '/api/users/999',
          },
        });

        // Should return error response, not throw
        expect(result).toBeDefined();
      });
    });

    describe('reload_schema', () => {
      it('should trigger schema reload', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: { message: 'Schema reloaded successfully' },
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'reload_schema',
          arguments: {},
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/__schemock/reload'),
          {},
          expect.any(Object)
        );
      });

      it('should include schema path in reload request', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: { message: 'Schema reloaded successfully' },
        });

        const handler = mockServer.getRequestHandler(CallToolRequestSchema);
        const result = await handler({
          name: 'reload_schema',
          arguments: {
            schemaPath: './examples/updated-schema.json',
          },
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/__schemock/reload'),
          { schemaPath: './examples/updated-schema.json' },
          expect.any(Object)
        );
      });
    });
  });

  describe('Route Extraction', () => {
    it('should extract routes from x-schemock-routes', () => {
      server = new SchemockerMCPServer({});
      const schema = {
        'x-schemock-routes': [
          { path: '/custom', method: 'get', response: { data: 'test' } },
        ],
      };

      const routes = (server as any).extractRoutesFromSchema(schema);
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe('/custom');
    });

    it('should generate CRUD routes when x-schemock-routes not present', () => {
      server = new SchemockerMCPServer({});
      const schema = {
        title: 'Product',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const routes = (server as any).extractRoutesFromSchema(schema);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.some((r: any) => r.method === 'GET' && r.path === '/api/resource')).toBe(true);
      expect(routes.some((r: any) => r.method === 'POST' && r.path === '/api/resource')).toBe(true);
    });
  });
});
