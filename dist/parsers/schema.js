"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaParser = void 0;
const errors_1 = require("../errors");
class SchemaParser {
    /**
     * Parse a JSON schema and generate mock data based on the schema definition
     * @param schema - The schema to parse
     * @param rootSchema - Root schema for $ref resolution (defaults to schema)
     * @param visited - Set of visited references to prevent circular loops
     * @param strict - Whether to enforce strict validation
     */
    static parse(schema, rootSchema, visited = new Set(), strict = false, propertyName) {
        if (!schema) {
            throw new errors_1.SchemaParseError('Schema is required');
        }
        const root = rootSchema || schema;
        // Handle references
        if (schema.$ref) {
            return this.resolveRef(schema.$ref, root, visited, strict, propertyName);
        }
        // Handle oneOf/anyOf/allOf
        if (schema.oneOf && schema.oneOf.length > 0) {
            const randomIndex = Math.floor(Math.random() * schema.oneOf.length);
            return this.parse(schema.oneOf[randomIndex], root, visited, strict, propertyName);
        }
        if (schema.anyOf && schema.anyOf.length > 0) {
            const randomIndex = Math.floor(Math.random() * schema.anyOf.length);
            return this.parse(schema.anyOf[randomIndex], root, visited, strict, propertyName);
        }
        if (schema.allOf && schema.allOf.length > 0) {
            return schema.allOf.reduce((result, subSchema) => {
                const parsed = this.parse(subSchema, root, visited, strict, propertyName);
                return typeof parsed === 'object' && parsed !== null
                    ? { ...result, ...parsed }
                    : parsed;
            }, {});
        }
        // Handle different schema types
        switch (schema.type) {
            case 'string':
                return this.generateString(schema, strict, propertyName);
            case 'number':
            case 'integer':
                return this.generateNumber(schema, strict, propertyName);
            case 'boolean':
                return this.generateBoolean();
            case 'array':
                return this.generateArray(schema, root, visited, strict);
            case 'object':
                return this.generateObject(schema, root, visited, strict);
            case 'null':
                return null;
            default:
                if (Array.isArray(schema.type)) {
                    // If multiple types are allowed, pick one randomly
                    const randomType = schema.type[Math.floor(Math.random() * schema.type.length)];
                    return this.parse({ ...schema, type: randomType }, root, visited, strict, propertyName);
                }
                // Loose mode fallback for unknown type
                if (!strict && schema.properties) {
                    return this.generateObject(schema, root, visited, strict);
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
            return null;
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
        // Mark as visited before parsing to catch circular refs
        visited.add(ref);
        // Parse the resolved schema
        const result = this.parse(resolved, rootSchema, visited, strict, propertyName);
        // Remove from visited so it can be used in other branches
        visited.delete(ref);
        return result;
    }
    static generateString(schema, strict = false, propertyName) {
        if (schema.enum) {
            return schema.enum[Math.floor(Math.random() * schema.enum.length)];
        }
        // Heuristics based on property name
        if (propertyName) {
            const name = propertyName.toLowerCase();
            if (name.includes('email'))
                return `user${Math.floor(Math.random() * 1000)}@example.com`;
            if (name.includes('firstname'))
                return ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'][Math.floor(Math.random() * 5)];
            if (name.includes('lastname'))
                return ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor'][Math.floor(Math.random() * 5)];
            if (name.includes('fullname') || name === 'name')
                return ['John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown'][Math.floor(Math.random() * 4)];
            if (name.includes('password'))
                return '********';
            if (name.includes('phone'))
                return `+1-555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
            if (name.includes('city'))
                return ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'][Math.floor(Math.random() * 5)];
            if (name.includes('country'))
                return ['USA', 'UK', 'France', 'Japan', 'Germany'][Math.floor(Math.random() * 5)];
            if (name.includes('company'))
                return ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech'][Math.floor(Math.random() * 4)];
            if (name.includes('title'))
                return ['Project Alpha', 'Awesome Feature', 'New Release', 'Bug Fix'][Math.floor(Math.random() * 4)];
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
                    return `test${Math.floor(Math.random() * 1000)}@example.com`;
                case 'hostname':
                    return 'example.com';
                case 'ipv4':
                    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
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
        const length = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));
        let result = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return result;
    }
    static generateNumber(schema, strict = false, propertyName) {
        // Heuristics based on property name
        if (propertyName) {
            const name = propertyName.toLowerCase();
            if (name.includes('age'))
                return 18 + Math.floor(Math.random() * 60);
            if (name.includes('price') || name.includes('amount'))
                return parseFloat((Math.random() * 100).toFixed(2));
            if (name.includes('year'))
                return 1970 + Math.floor(Math.random() * 60);
            if (name.includes('rating'))
                return parseFloat((Math.random() * 5).toFixed(1));
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
            return min + (Math.floor(Math.random() * (steps + 1)) * schema.multipleOf);
        }
        return min + Math.random() * (max - min);
    }
    static generateBoolean() {
        return Math.random() > 0.5;
    }
    static generateArray(schema, rootSchema, visited = new Set(), strict = false) {
        const minItems = schema.minItems || (strict ? 1 : 0);
        const maxItems = schema.maxItems || Math.max(minItems + (strict ? 2 : 5), 10);
        const count = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
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
            if (isRequired || !strict || Math.random() > 0.1) {
                result[key] = this.parse(propSchema, root, visited, strict, key);
            }
        }
        // Handle additionalProperties
        if (schema.additionalProperties) {
            const additionalProps = typeof schema.additionalProperties === 'boolean'
                ? 3
                : Math.min(3, Math.floor(Math.random() * 5));
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