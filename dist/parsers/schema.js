"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaParser = void 0;
const types_1 = require("../types");
const errors_1 = require("../errors");
const cache_1 = require("../utils/cache");
const constants_1 = require("../utils/constants");
const random_1 = require("../utils/random");
const config_1 = require("../utils/config");
// Create a singleton cache for parsed schemas
const schemaCache = new cache_1.LRUCache({
    maxSize: constants_1.DEFAULT_CACHE_SIZE,
    ttl: constants_1.CACHE_TTL
});
class SchemaParser {
    /**
      * Clear's schema cache
      */
    static clearCache() {
        schemaCache.clear();
    }
    /**
      * Get cache statistics
      */
    static getCacheStats() {
        return schemaCache.getStats();
    }
    /**
      * Initialize the random generator with a seed for reproducible results
      */
    static initRandomGenerator(seed) {
        (0, random_1.initRandomGenerator)(seed);
    }
    /**
      * Reset the random generator to its initial seed
      */
    static resetRandomGenerator() {
        (0, random_1.resetRandomGenerator)();
    }
    /**
     * Parse a JSON schema and generate mock data based on the schema definition
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution (defaults to schema)
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param useCache - Whether to use caching (default: true)
     */
    static parse(schema, rootSchema, visited = new Set(), strict = false, propertyName, useCache = true) {
        if (!schema) {
            throw new errors_1.SchemaParseError('Schema is required');
        }
        // Check cache if enabled and no visited references (avoid caching circular refs)
        const cacheKey = useCache && visited.size === 0
            ? (0, cache_1.createCacheKey)(schema, { strict, propertyName })
            : null;
        if (cacheKey && schemaCache.has(cacheKey)) {
            const cached = schemaCache.get(cacheKey);
            if (cached !== undefined && cached !== null) {
                return cached;
            }
        }
        const root = rootSchema || schema;
        let result;
        // Handle references
        if (schema.$ref) {
            result = this.resolveRef(schema.$ref, root, visited, strict, propertyName);
        }
        else {
            // Handle oneOf/anyOf/allOf
            if (schema.oneOf && schema.oneOf.length > 0) {
                const randomIndex = (0, random_1.randomInt)(0, schema.oneOf.length - 1);
                result = this.parse(schema.oneOf[randomIndex], root, visited, strict, propertyName, false);
            }
            else if (schema.anyOf && schema.anyOf.length > 0) {
                const randomIndex = (0, random_1.randomInt)(0, schema.anyOf.length - 1);
                result = this.parse(schema.anyOf[randomIndex], root, visited, strict, propertyName, false);
            }
            else if (schema.allOf && schema.allOf.length > 0) {
                result = schema.allOf.reduce((acc, subSchema) => {
                    const parsed = this.parse(subSchema, root, visited, strict, propertyName, false);
                    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
                        ? (0, config_1.safeMerge)(acc, parsed)
                        : acc;
                }, {});
            }
            else {
                // Handle different schema types
                result = this.parseByType(schema, root, visited, strict, propertyName);
            }
        }
        // Cache result if enabled
        if (cacheKey && useCache) {
            schemaCache.set(cacheKey, result);
        }
        return result;
    }
    /**
     * Parse schema based on its type
     */
    static parseByType(schema, rootSchema, visited, strict, propertyName) {
        switch (schema.type) {
            case 'string':
                return this.generateString(schema, strict, propertyName);
            case 'number':
            case 'integer':
                return this.generateNumber(schema, strict, propertyName);
            case 'boolean':
                return this.generateBoolean();
            case 'array':
                return this.generateArray(schema, rootSchema, visited, strict);
            case 'object':
                return this.generateObject(schema, rootSchema, visited, strict);
            case 'null':
                return {}; // Return empty object instead of null for type safety
            default:
                if (Array.isArray(schema.type)) {
                    // If multiple types are allowed, pick one randomly
                    const randomType = schema.type[(0, random_1.randomInt)(0, schema.type.length - 1)];
                    return this.parseByType({ ...schema, type: randomType }, rootSchema, visited, strict, propertyName);
                }
                // Loose mode fallback for unknown type
                if (!strict && schema.properties) {
                    return this.generateObject(schema, rootSchema, visited, strict);
                }
                return 'UNKNOWN_TYPE';
        }
    }
    /**
     * Resolve a JSON Schema $ref reference
     * @param ref - The reference string (e.g., "#/definitions/User")
     * @param rootSchema - The root schema containing definitions
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     * @param propertyName - Optional property name for heuristics
     */
    static resolveRef(ref, rootSchema, visited, strict = false, propertyName) {
        // Check for circular references
        if (visited.has(ref)) {
            console.warn(`Circular reference detected: ${ref}`);
            return {}; // Return empty object for circular refs instead of null
        }
        // Only handle internal references for now (starting with #/)
        if (!ref.startsWith('#/')) {
            console.warn(`External references not supported yet: ${ref}`);
            return 'EXTERNAL_REF_NOT_SUPPORTED';
        }
        // Parse the reference path
        const path = ref.substring(2).split('/'); // Remove '#/' and split
        let resolved = rootSchema;
        // Navigate through the schema
        for (const part of path) {
            if (resolved && typeof resolved === 'object' && part in resolved) {
                resolved = resolved[part];
            }
            else {
                throw new errors_1.SchemaRefError(`Cannot resolve $ref: ${ref}. Path not found: ${part}`, ref);
            }
        }
        // Type guard to ensure resolved is a Schema
        if (!(0, types_1.isSchema)(resolved)) {
            throw new errors_1.SchemaRefError(`Cannot resolve $ref: ${ref}. Resolved value is not a valid Schema`, ref);
        }
        // Mark as visited before parsing to catch circular refs
        visited.add(ref);
        // Parse the resolved schema
        const result = this.parse(resolved, rootSchema, visited, strict, propertyName);
        // Remove from visited so it can be used in other branches
        visited.delete(ref);
        return result;
    }
    static generateString(schema, strict = false, propertyName) {
        if (schema.enum && schema.enum.length > 0) {
            const enumValue = schema.enum[(0, random_1.randomInt)(0, schema.enum.length - 1)];
            // Handle null in enum - return empty string or a default value
            if (enumValue === null) {
                return '';
            }
            // Convert non-string enum values to string
            if (typeof enumValue !== 'string') {
                return String(enumValue);
            }
            return enumValue;
        }
        // Heuristics based on property name
        if (propertyName) {
            const name = propertyName.toLowerCase();
            if (name.includes('email'))
                return `user${(0, random_1.randomInt)(0, 999)}@example.com`;
            if (name.includes('firstname'))
                return ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'][(0, random_1.randomInt)(0, 4)];
            if (name.includes('lastname'))
                return ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor'][(0, random_1.randomInt)(0, 4)];
            if (name.includes('fullname') || name === 'name')
                return ['John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown'][(0, random_1.randomInt)(0, 3)];
            if (name.includes('password'))
                return '********';
            if (name.includes('phone'))
                return `+1-555-${(0, random_1.randomInt)(100, 999)}-${(0, random_1.randomInt)(1000, 9999)}`;
            if (name.includes('city'))
                return ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'][(0, random_1.randomInt)(0, 4)];
            if (name.includes('country'))
                return ['USA', 'UK', 'France', 'Japan', 'Germany'][(0, random_1.randomInt)(0, 4)];
            if (name.includes('company'))
                return ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech'][(0, random_1.randomInt)(0, 3)];
            if (name.includes('title'))
                return ['Project Alpha', 'Awesome Feature', 'New Release', 'Bug Fix'][(0, random_1.randomInt)(0, 3)];
            if (name.includes('description') || name.includes('summary'))
                return 'A comprehensive description of the resource with all necessary details.';
            if (name.includes('id') || name.includes('uuid'))
                return '123e4567-e89b-12d3-a456-426614174000';
        }
        if (schema.format) {
            switch (schema.format) {
                case 'date-time':
                    return new Date().toISOString();
                case 'date':
                    return new Date().toISOString().split('T')[0];
                case 'time':
                    return new Date().toISOString().split('T')[1].split('.')[0];
                case 'email':
                    return `test${(0, random_1.randomInt)(0, 999)}@example.com`;
                case 'hostname':
                    return 'example.com';
                case 'ipv4':
                    return `${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(0, 255)}.${(0, random_1.randomInt)(0, 255)}`;
                case 'ipv6':
                    return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
                case 'uri':
                case 'url':
                    return 'https://example.com';
                case 'uuid':
                    return '123e4567-e89b-12d3-a456-426614174000';
            }
        }
        if (schema.pattern) {
            // Simple patterns - in a real implementation, you'd use a library to generate from regex
            if (schema.pattern === '^[0-9]{3}-[0-9]{2}-[0-9]{4}$') {
                return '123-45-6789';
            }
            // For other patterns, return a generic string
        }
        const minLength = schema.minLength || 0;
        const maxLength = schema.maxLength || Math.max(10, minLength + 5);
        const length = minLength + (0, random_1.randomInt)(0, maxLength - minLength);
        let result = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += possible.charAt((0, random_1.randomInt)(0, possible.length - 1));
        }
        return result;
    }
    static generateNumber(schema, strict = false, propertyName) {
        // Heuristics based on property name
        if (propertyName) {
            const name = propertyName.toLowerCase();
            if (name.includes('age'))
                return 18 + (0, random_1.randomInt)(0, 60);
            if (name.includes('price') || name.includes('amount'))
                return parseFloat((0, random_1.randomFloat)(0, 100).toFixed(2));
            if (name.includes('year'))
                return 1970 + (0, random_1.randomInt)(0, 60);
            if (name.includes('rating'))
                return parseFloat((0, random_1.randomFloat)(0, 5).toFixed(1));
        }
        let min = typeof schema.minimum === 'number' ? schema.minimum : (strict ? 0 : -100);
        let max = typeof schema.maximum === 'number' ? schema.maximum : (strict ? 100 : 1000);
        // In strict mode, if multipleOf is present, ensures values are strictly compliant
        if (strict && schema.multipleOf && min % schema.multipleOf !== 0) {
            min = Math.ceil(min / schema.multipleOf) * schema.multipleOf;
        }
        // Handle exclusive minimum/maximum
        if (schema.exclusiveMinimum !== undefined) {
            if (typeof schema.exclusiveMinimum === 'boolean' && schema.exclusiveMinimum) {
                min += (schema.multipleOf || 1);
            }
            else if (typeof schema.exclusiveMinimum === 'number') {
                min = schema.exclusiveMinimum + (schema.multipleOf || 0.01);
            }
        }
        if (schema.exclusiveMaximum !== undefined) {
            if (typeof schema.exclusiveMaximum === 'boolean' && schema.exclusiveMaximum) {
                max -= (schema.multipleOf || 1);
            }
            else if (typeof schema.exclusiveMaximum === 'number') {
                max = schema.exclusiveMaximum - (schema.multipleOf || 0.01);
            }
        }
        if (max < min)
            max = min + (schema.multipleOf || 1);
        // Handle multipleOf if specified
        if (schema.multipleOf) {
            const range = max - min;
            const steps = Math.floor(range / schema.multipleOf);
            return min + ((0, random_1.randomInt)(0, steps) * schema.multipleOf);
        }
        return (0, random_1.randomFloat)(min, max);
    }
    static generateBoolean() {
        return (0, random_1.random)() > 0.5;
    }
    static generateArray(schema, rootSchema, visited = new Set(), strict = false) {
        const minItems = schema.minItems || (strict ? 1 : 0);
        const maxItems = schema.maxItems || Math.max(minItems + (strict ? 2 : 5), 10);
        const count = minItems + (0, random_1.randomInt)(0, maxItems - minItems);
        if (!schema.items) {
            return [];
        }
        const result = [];
        const root = rootSchema || schema;
        if (Array.isArray(schema.items)) {
            // Tuple type
            for (let i = 0; i < Math.min(count, schema.items.length); i++) {
                result.push(this.parse(schema.items[i], root, visited, strict));
            }
        }
        else {
            // Array of items with the same schema
            for (let i = 0; i < count; i++) {
                result.push(this.parse(schema.items, root, visited, strict));
            }
        }
        return result;
    }
    static generateObject(schema, rootSchema, visited = new Set(), strict = false) {
        if (!schema.properties) {
            return {};
        }
        const result = {};
        const required = new Set(schema.required || []);
        const root = rootSchema || schema;
        // Process all properties
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            // In strict mode, always include required properties
            // In loose mode, or for non-required, have a high chance to include (90%)
            const isRequired = required.has(key);
            if (isRequired || !strict || (0, random_1.random)() > 0.1) {
                result[key] = this.parse(propSchema, root, visited, strict, key);
            }
        }
        // Handle additionalProperties
        if (schema.additionalProperties) {
            const additionalProps = typeof schema.additionalProperties === 'boolean'
                ? 3
                : Math.min(3, (0, random_1.randomInt)(0, 4));
            for (let i = 0; i < additionalProps; i++) {
                const propName = `extra_${i}`;
                if (!(propName in result)) {
                    result[propName] = typeof schema.additionalProperties === 'boolean'
                        ? 'additional_value'
                        : this.parse(schema.additionalProperties, root, visited, strict);
                }
            }
        }
        return result;
    }
}
exports.SchemaParser = SchemaParser;
//# sourceMappingURL=schema.js.map