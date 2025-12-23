import { Schema } from '../types';
/**
 * Generate route handlers based on the provided schema
 * @param schema - The JSON schema to generate routes for
 * @returns An object containing route configurations
 */
export declare function generateRouteConfigs(schema: Schema): Record<string, any>;
export declare function generateRoutes(schema: Schema): string;
