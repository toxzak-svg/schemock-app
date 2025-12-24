import { ServerGenerator } from './generators/server';
import { ServerOptions } from './types';

/**
 * Main entry point for the Schemock application
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 */
export function createMockServer(schema: any, options: ServerOptions = { port: 3000 }) {
  const server = ServerGenerator.generateFromSchema(schema, options);
  server.start();
  return server;
}

// If this file is run directly, start a simple mock server
if (require.main === module) {
  // Default schema for the demo
  const defaultSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 0, maximum: 120 },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5
      }
    },
    required: ['id', 'name', 'email', 'isActive', 'createdAt']
  };

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = createMockServer(defaultSchema, { 
    port,
    logLevel: 'info',
    cors: true
  });

  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
  });
}

export * from './types';
export * from './generators/server';
export * from './parsers/schema';
export * from './errors';
export * from './utils/validation';
