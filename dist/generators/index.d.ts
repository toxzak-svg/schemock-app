import { ServerGenerator } from './server';
import { Schema, ServerOptions } from '../types';
/**
 * Generate a mock server from a JSON schema
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 * @returns The server generator instance
 */
export declare function generateMockServer(schema: Schema, options?: ServerOptions): ServerGenerator;
/**
 * Create a mock server with the provided configuration
 * @param config - The mock server configuration
 * @returns The server generator instance
 */
export declare function createMockServer(config: {
    server: ServerOptions;
    routes: any;
}): ServerGenerator;
export * from './server';
export * from './routes';
