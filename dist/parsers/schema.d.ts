import { Schema, NonNullJSONValue } from '../types';
export declare class SchemaParser {
    /**
      * Clear's schema cache
      */
    static clearCache(): void;
    /**
      * Get cache statistics
      */
    static getCacheStats(): {
        size: number;
        maxSize: number;
        hasTTL: boolean;
    };
    /**
      * Initialize the random generator with a seed for reproducible results
      */
    static initRandomGenerator(seed?: number): void;
    /**
      * Reset the random generator to its initial seed
      */
    static resetRandomGenerator(): void;
    /**
     * Parse a JSON schema and generate mock data based on the schema definition
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution (defaults to schema)
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param useCache - Whether to use caching (default: true)
     */
    static parse(schema: Schema, rootSchema?: Schema, visited?: Set<string>, strict?: boolean, propertyName?: string, useCache?: boolean): NonNullJSONValue;
    /**
     * Parse schema based on its type
     */
    private static parseByType;
    /**
     * Resolve a JSON Schema $ref reference
     * @param ref - The reference string (e.g., "#/definitions/User")
     * @param rootSchema - The root schema containing definitions
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics
     */
    private static resolveRef;
    private static generateString;
    private static generateNumber;
    private static generateBoolean;
    private static generateArray;
    private static generateObject;
}
