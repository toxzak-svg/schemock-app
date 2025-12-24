import { ServerGenerator } from './generators/server';
import { ServerOptions } from './types';
/**
 * Main entry point for the Schemock application
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 */
export declare function createMockServer(schema: any, options?: ServerOptions): ServerGenerator;
export * from './types';
export * from './generators/server';
export * from './parsers/schema';
export * from './errors';
export * from './utils/validation';
