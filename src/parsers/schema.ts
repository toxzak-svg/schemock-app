import { Schema } from '../types';
import { SchemaParseError, SchemaRefError } from '../errors';

export class SchemaParser {
  /**
   * Parse a JSON schema and generate mock data based on the schema definition
   * @param schema - The schema to parse
   * @param rootSchema - Root schema for $ref resolution (defaults to schema)
   * @param visited - Set of visited references to prevent circular loops
   */
  static parse(schema: Schema, rootSchema?: Schema, visited: Set<string> = new Set()): any {
    if (!schema) {
      throw new SchemaParseError('Schema is required');
    }

    const root = rootSchema || schema;

    // Handle references
    if (schema.$ref) {
      return this.resolveRef(schema.$ref, root, visited);
    }

    // Handle oneOf/anyOf/allOf
    if (schema.oneOf && schema.oneOf.length > 0) {
      const randomIndex = Math.floor(Math.random() * schema.oneOf.length);
      return this.parse(schema.oneOf[randomIndex], root, visited);
    }

    if (schema.anyOf && schema.anyOf.length > 0) {
      const randomIndex = Math.floor(Math.random() * schema.anyOf.length);
      return this.parse(schema.anyOf[randomIndex], root, visited);
    }

    if (schema.allOf && schema.allOf.length > 0) {
      return schema.allOf.reduce((result, subSchema) => {
        const parsed = this.parse(subSchema, root, visited);
        return typeof parsed === 'object' && parsed !== null
          ? { ...result, ...parsed }
          : parsed;
      }, {});
    }

    // Handle different schema types
    switch (schema.type) {
      case 'string':
        return this.generateString(schema);
      case 'number':
      case 'integer':
        return this.generateNumber(schema);
      case 'boolean':
        return this.generateBoolean();
      case 'array':
        return this.generateArray(schema, root, visited);
      case 'object':
        return this.generateObject(schema, root, visited);
      case 'null':
        return null;
      default:
        if (Array.isArray(schema.type)) {
          // If multiple types are allowed, pick one randomly
          const randomType = schema.type[Math.floor(Math.random() * schema.type.length)];
          return this.parse({ ...schema, type: randomType }, root, visited);
        }
        return 'UNKNOWN_TYPE';
    }
  }

  /**
   * Resolve a JSON Schema $ref reference
   * @param ref - The reference string (e.g., "#/definitions/User")
   * @param rootSchema - The root schema containing definitions
   * @param visited - Set of visited references to prevent circular loops
   */
  private static resolveRef(ref: string, rootSchema: Schema, visited: Set<string>): any {
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
    let resolved: any = rootSchema;

    // Navigate through the schema
    for (const part of path) {
      if (resolved && typeof resolved === 'object' && part in resolved) {
        resolved = resolved[part];
      } else {
        throw new SchemaRefError(
          `Cannot resolve $ref: ${ref}. Path not found: ${part}`,
          ref
        );
      }
    }

    // Mark as visited before parsing to catch circular refs
    visited.add(ref);

    // Parse the resolved schema
    return this.parse(resolved, rootSchema, visited);
  }

  private static generateString(schema: Schema): string {
    if (schema.enum) {
      return schema.enum[Math.floor(Math.random() * schema.enum.length)];
    }

    if (schema.format) {
      switch (schema.format) {
        case 'date-time':
          return new Date().toISOString();
        case 'email':
          return 'test@example.com';
        case 'hostname':
          return 'example.com';
        case 'ipv4':
          return '192.168.1.1';
        case 'ipv6':
          return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
        case 'uri':
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

  private static generateNumber(schema: Schema): number {
    let min = typeof schema.minimum === 'number' ? schema.minimum : 0;
    let max = typeof schema.maximum === 'number' ? schema.maximum : 100;
    
    // Handle exclusive minimum/maximum
    if (schema.exclusiveMinimum !== undefined) {
      if (typeof schema.exclusiveMinimum === 'boolean' && schema.exclusiveMinimum) {
        min += 1;
      } else if (typeof schema.exclusiveMinimum === 'number') {
        min = schema.exclusiveMinimum + 1;
      }
    }
    
    if (schema.exclusiveMaximum !== undefined) {
      if (typeof schema.exclusiveMaximum === 'boolean' && schema.exclusiveMaximum) {
        max -= 1;
      } else if (typeof schema.exclusiveMaximum === 'number') {
        max = schema.exclusiveMaximum - 1;
      }
    }
    
    // Handle multipleOf if specified
    if (schema.multipleOf) {
      const range = max - min;
      const steps = Math.floor(range / schema.multipleOf);
      return min + (Math.floor(Math.random() * (steps + 1)) * schema.multipleOf);
    }
    
    return min + Math.random() * (max - min);
  }

  private static generateBoolean(): boolean {
    return Math.random() > 0.5;
  }

  private static generateArray(schema: Schema, rootSchema?: Schema, visited: Set<string> = new Set()): any[] {
    const minItems = schema.minItems || 1;
    const maxItems = schema.maxItems || Math.max(5, minItems);
    const count = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
    
    if (!schema.items) {
      return [];
    }
    
    const result: any[] = [];
    const root = rootSchema || schema;
    
    if (Array.isArray(schema.items)) {
      // Tuple type
      for (let i = 0; i < Math.min(count, schema.items.length); i++) {
        result.push(this.parse(schema.items[i], root, visited));
      }
    } else {
      // Array of items with the same schema
      for (let i = 0; i < count; i++) {
        result.push(this.parse(schema.items, root, visited));
      }
    }
    
    return result;
  }

  private static generateObject(schema: Schema, rootSchema?: Schema, visited: Set<string> = new Set()): Record<string, any> {
    if (!schema.properties) {
      return {};
    }
    
    const result: Record<string, any> = {};
    const required = new Set(schema.required || []);
    const root = rootSchema || schema;
    
    // Process all properties
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Only include required properties and those with a 50% chance for optional ones
      if (required.has(key) || Math.random() > 0.5) {
        result[key] = this.parse(propSchema as Schema, root, visited);
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
            : this.parse(schema.additionalProperties, root, visited);
        }
      }
    }
    
    return result;
  }
}
