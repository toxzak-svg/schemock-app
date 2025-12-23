import { ServerGenerator } from './server';
import { Schema, ServerOptions } from '../types';

/**
 * Generate a mock server from a JSON schema
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 * @returns The server generator instance
 */
export function generateMockServer(schema: Schema, options: ServerOptions = { port: 3000 }) {
  return ServerGenerator.generateFromSchema(schema, options);
}

/**
 * Create a mock server with the provided configuration
 * @param config - The mock server configuration
 * @returns The server generator instance
 */
export function createMockServer(config: { server: ServerOptions; routes: any }) {
  return new ServerGenerator(config);
}

export * from './server';
export * from './routes';
