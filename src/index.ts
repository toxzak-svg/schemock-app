import { ServerGenerator } from './generators/server';
import { ServerOptions } from './types';
import { validatePort, validateSchema } from './utils/validation';

/**
 * Main entry point for Schemock application
 *
 * Creates a mock server instance from a JSON schema. The server is not started
 * automatically; you must call the start() method on the returned instance.
 *
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 * @returns A ServerGenerator instance that has not been started yet
 */
export function createMockServer(schema: any, options: ServerOptions = { port: 3000 }) {
  // Validate schema if provided (addresses issue 10.1)
  if (schema) {
    try {
      validateSchema(schema, options.strict || false);
    } catch (error) {
      // Log warning but continue - schema parser may still work
      console.warn(`Schema validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate port (addresses issue 10.1)
  if (options.port !== undefined) {
    options.port = validatePort(options.port);
  }

  return ServerGenerator.generateFromSchema(schema, options);
}

// If this file is run directly, start a simple mock server
if (require.main === module) {
  // Default schema for demo
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

  // Validate port from environment variable (addresses issue 10.1)
  const port = process.env.PORT ? validatePort(process.env.PORT) : 3000;
  const server = createMockServer(defaultSchema, {
    port,
    logLevel: 'info',
    cors: true
  });

  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
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
export * from './utils/watcher';
export * from './integrations/vite';
export * from './utils/config';
