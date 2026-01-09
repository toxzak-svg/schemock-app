import { Schema, NonNullJSONValue } from '../types';
/**
 * A parser for JSON Schema that generates mock data based on schema definitions.
 *
 * Supports various JSON Schema features including types, formats, patterns,
 * constraints, references (oneOf, anyOf, allOf, $ref), and property heuristics
 * for generating realistic mock data.
 *
 * Uses an LRU cache to improve performance for repeated schema parsing.
 */
export declare class SchemaParser {
    /**
     * Clears the schema cache
     *
     * Removes all cached parsed schemas from the LRU cache.
     */
    static clearCache(): void;
    /**
     * Gets cache statistics
     *
     * @returns Statistics about the cache including hits, misses, and size
     */
    static getCacheStats(): {
        size: number;
        maxSize: number;
        hasTTL: boolean;
    };
    /**
     * Initializes the random generator with a seed for reproducible results
     *
     * @param seed - Optional seed value for the random number generator
     */
    static initRandomGenerator(seed?: number): void;
    /**
     * Resets the random generator to its initial seed
     *
     * Restores the random number generator to its initial state for reproducible results.
     */
    static resetRandomGenerator(): void;
    /**
     * Parses a JSON schema and generates mock data based on the schema definition
     *
     * Handles schema references, composition keywords (oneOf, anyOf, allOf),
     * and various schema types. Uses caching for improved performance.
     *
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution (defaults to schema)
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics-based generation
     * @param useCache - Whether to use caching (default: true)
     * @returns Generated mock data matching the schema
     * @throws {SchemaParseError} When the schema is invalid or cannot be parsed
     * @throws {SchemaRefError} When a $ref cannot be resolved
     */
    static parse(schema: Schema, rootSchema?: Schema, visited?: Set<string>, strict?: boolean, propertyName?: string, useCache?: boolean): NonNullJSONValue;
    /**
     * Parses a schema based on its type
     *
     * Delegates to the appropriate generator method based on the schema type.
     *
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics-based generation
     * @returns Generated mock data matching the schema type
     */
    private static parseByType;
    /**
     * Resolves a JSON Schema $ref reference
     *
     * Navigates through the schema to find the referenced definition and parses it.
     * Handles circular references by tracking visited references.
     *
     * @param ref - The reference string (e.g., "#/definitions/User")
     * @param rootSchema - The root schema containing definitions
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics
     * @returns Generated mock data from the resolved schema
     * @throws {SchemaRefError} When the reference cannot be resolved
     */
    private static resolveRef;
    /**
     * Generates a random string value based on the schema
     *
     * Uses heuristics based on property name and schema format to generate
     * realistic mock data (e.g., emails, dates, phone numbers).
     *
     * @param schema - The string schema to generate from
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics-based generation
     * @returns A generated string value
     */
    private static generateString;
    /**
     * Generates a random number value based on the schema
     *
     * Respects minimum, maximum, multipleOf, and exclusive bounds constraints.
     * Uses heuristics based on property name for realistic values.
     *
     * @param schema - The number schema to generate from
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics-based generation
     * @returns A generated number value
     */
    private static generateNumber;
    /**
     * Generates a random boolean value
     *
     * @returns A random true or false value
     */
    private static generateBoolean;
    /**
     * Generates a random array based on the schema
     *
     * Supports both tuple types (array of specific schemas) and homogeneous arrays
     * (all items follow the same schema).
     *
     * @param schema - The array schema to generate from
     * @param rootSchema - Root schema for $ref resolution
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @returns A generated array of values
     */
    private static generateArray;
    /**
     * Generates a random object based on the schema
     *
     * Includes required properties and optionally includes non-required properties.
     * Supports additionalProperties for generating extra fields.
     *
     * @param schema - The object schema to generate from
     * @param rootSchema - Root schema for $ref resolution
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @returns A generated object with properties matching the schema
     */
    private static generateObject;
}
