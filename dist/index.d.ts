import { ServerGenerator } from './generators/server';
import { ServerOptions } from './types';
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
export declare function createMockServer(schema: any, options?: ServerOptions): ServerGenerator;
export * from './types';
export * from './generators/server';
export * from './parsers/schema';
export * from './errors';
export * from './utils/validation';
export * from './utils/watcher';
export * from './integrations/vite';
export * from './utils/config';
