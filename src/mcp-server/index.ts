#!/usr/bin/env node

// Using require to work around TypeScript module resolution issues with @modelcontextprotocol/sdk
const MCP_SDK = require('@modelcontextprotocol/sdk');
const axios = require('axios');

/**
 * Schemocker MCP Server
 * 
 * This MCP server provides tools to interact with a running Schemocker instance,
 * allowing AI assistants to discover available endpoints, make requests, and reload schemas.
 */

class SchemockerMCPServer {
  private server: any;
  private baseUrl: string;
  private config: any;

  constructor(config: any = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.SCHEMOCKER_BASE_URL || 'http://localhost:3000',
      timeout: config.timeout || 10000,
      ...config,
    };
    this.baseUrl = this.config.baseUrl || 'http://localhost:3000';

    this.server = new MCP_SDK.Server(
      {
        name: 'schemocker-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Sets up tool request handlers for MCP server
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(MCP_SDK.ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(MCP_SDK.CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_routes':
            return await this.handleListRoutes(args);
          case 'call_endpoint':
            return await this.handleCallEndpoint(args);
          case 'reload_schema':
            return await this.handleReloadSchema(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  /**
   * Returns the list of available tools
   */
  private getAvailableTools(): any[] {
    return [
      {
        name: 'list_routes',
        description: 'Lists all available routes/endpoints from Schemocker mock server, including paths, methods, and example payload shapes',
        inputSchema: {
          type: 'object',
          properties: {
            includeExamples: {
              type: 'boolean',
              description: 'Whether to include example responses for each route (default: true)',
              default: true,
            },
          },
        },
      },
      {
        name: 'call_endpoint',
        description: 'Makes an HTTP request to a Schemocker endpoint and returns JSON response',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              description: 'HTTP method to use',
            },
            path: {
              type: 'string',
              description: 'The endpoint path (e.g., /api/users)',
            },
            body: {
              type: 'object',
              description: 'Request body for POST, PUT, PATCH requests',
            },
            query: {
              type: 'object',
              description: 'Query parameters as key-value pairs',
            },
            headers: {
              type: 'object',
              description: 'Additional headers to include in the request',
            },
          },
          required: ['method', 'path'],
        },
      },
      {
        name: 'reload_schema',
        description: 'Triggers a schema reload on the Schemocker server to pick up schema changes',
        inputSchema: {
          type: 'object',
          properties: {
            schemaPath: {
              type: 'string',
              description: 'Optional path to the schema file to reload (if not using the default schema)',
            },
          },
        },
      },
    ];
  }

  /**
   * Handles the list_routes tool call
   */
  private async handleListRoutes(args?: any) {
    const includeExamples = args?.includeExamples !== false;

    try {
      // Try to get routes from Schemocker's internal routes endpoint
      const routesUrl = `${this.baseUrl}/__schemock/routes`;
      let routes: any[] = [];

      try {
        const response = await axios.get(routesUrl, {
          timeout: this.config.timeout,
        });
        routes = response.data.routes || [];
      } catch (_error) {
        // If the routes endpoint doesn't exist, try to discover from the schema
        const schemaUrl = `${this.baseUrl}/__schemock/schema`;
        const schemaResponse = await axios.get(schemaUrl, {
          timeout: this.config.timeout,
        });
        routes = this.extractRoutesFromSchema(schemaResponse.data);
      }

      // If we want examples, fetch them
      if (includeExamples && routes.length > 0) {
        const routesWithExamples = await Promise.all(
          routes.map(async (route: any) => {
            try {
              const exampleResponse = await this.callSchemockerEndpoint(
                route.method,
                route.path
              );
              return {
                ...route,
                exampleResponse: exampleResponse.data,
              };
            } catch (_error) {
              // If we can't get an example, just return route info
              return route;
            }
          })
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(routesWithExamples, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(routes, null, 2),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      throw new Error(
        `Failed to list routes: ${axiosError.message}. Make sure Schemocker is running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the call_endpoint tool call
   */
  private async handleCallEndpoint(args: any) {
    const { method, path, body, query, headers } = args;

    if (!method || !path) {
      throw new Error('Missing required parameters: method and path are required');
    }

    try {
      const response = await this.callSchemockerEndpoint(
        method,
        path,
        body,
        query,
        headers
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      if (axiosError.response) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: axiosError.response.status,
                  statusText: axiosError.response.statusText,
                  headers: axiosError.response.headers,
                  data: axiosError.response.data,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
      throw new Error(
        `Failed to call endpoint: ${axiosError.message}. Make sure Schemocker is running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the reload_schema tool call
   */
  private async handleReloadSchema(args?: any) {
    const { schemaPath } = args || {};

    try {
      const reloadUrl = `${this.baseUrl}/__schemock/reload`;
      const response = await axios.post(
        reloadUrl,
        schemaPath ? { schemaPath } : {},
        {
          timeout: this.config.timeout,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: response.data.message || 'Schema reloaded successfully',
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      throw new Error(
        `Failed to reload schema: ${axiosError.message}. The reload endpoint may not be available or Schemocker is not running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Makes a call to a Schemocker endpoint
   */
  private async callSchemockerEndpoint(
    method: string,
    path: string,
    body?: any,
    query?: Record<string, unknown>,
    headers?: Record<string, string>
  ) {
    const url = `${this.baseUrl}${path}`;
    const config: any = {
      method: method.toLowerCase(),
      url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = body;
    }

    if (query) {
      config.params = query;
    }

    return await axios(config);
  }

  /**
   * Extracts route information from a JSON Schema
   */
  private extractRoutesFromSchema(schema: any): any[] {
    const routes: any[] = [];

    // Check for custom routes defined in x-schemock-routes
    if (schema['x-schemock-routes'] && Array.isArray(schema['x-schemock-routes'])) {
      return schema['x-schemock-routes'].map((route: any) => ({
        method: route.method.toUpperCase(),
        path: route.path,
        description: route.description || `Custom ${route.method.toUpperCase()} route`,
        statusCode: route.statusCode || 200,
        delay: route.delay,
        headers: route.headers,
      }));
    }

    // Generate CRUD routes based on schema properties
    const basePath = schema['x-schemock-base-path'] || '/api/resource';
    const resourceName = schema.title || 'resource';

    // GET /api/resource - List all items
    routes.push({
      method: 'GET',
      path: basePath,
      description: `List all ${resourceName} items`,
      response: { type: 'array', items: schema },
    });

    // GET /api/resource/:id - Get single item
    routes.push({
      method: 'GET',
      path: `${basePath}/:id`,
      description: `Get a single ${resourceName} by ID`,
      response: schema,
    });

    // POST /api/resource - Create new item
    routes.push({
      method: 'POST',
      path: basePath,
      description: `Create a new ${resourceName}`,
      request: schema,
      response: schema,
    });

    // PUT /api/resource/:id - Update item
    routes.push({
      method: 'PUT',
      path: `${basePath}/:id`,
      description: `Update a ${resourceName} by ID`,
      request: schema,
      response: schema,
    });

    // DELETE /api/resource/:id - Delete item
    routes.push({
      method: 'DELETE',
      path: `${basePath}/:id`,
      description: `Delete a ${resourceName} by ID`,
      response: { success: true },
    });

    return routes;
  }

  /**
   * Starts the MCP server
   */
  public async start(): Promise<void> {
    const transport = new MCP_SDK.StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Schemocker MCP Server started, connecting to ${this.baseUrl}`);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new SchemockerMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = { SchemockerMCPServer };
