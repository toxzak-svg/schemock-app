import { Schema } from '../types';
export declare class SchemaParser {
    /**
     * Parse a JSON schema and generate mock data based on the schema definition
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution (defaults to schema)
     * @param visited - Set of visited references to prevent circular loops
     */
    static parse(schema: Schema, rootSchema?: Schema, visited?: Set<string>): any;
    /**
     * Resolve a JSON Schema $ref reference
     * @param ref - The reference string (e.g., "#/definitions/User")
     * @param rootSchema - The root schema containing definitions
     * @param visited - Set of visited references to prevent circular loops
     */
    private static resolveRef;
    private static generateString;
    private static generateNumber;
    private static generateBoolean;
    private static generateArray;
    private static generateObject;
}
