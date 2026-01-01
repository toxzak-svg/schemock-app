import { Schema } from '../types';
/**
 * Generate route handlers based on the provided schema
 * @param schema - The JSON schema to generate routes for
 * @returns An object containing route configurations
 */
export declare function generateRouteConfigs(schema: Schema): Record<string, any>;
export declare function generateRoutes(schema: Schema): string;
/**
 * Generate a CRUD DSL for a resource
 * @param resourceName - The name of the resource (e.g., 'User')
 * @returns Array of route definitions
 */
export declare function generateCRUDDSL(resourceName: string): any[];
