/**
 * Comprehensive tests for SchemaParser with $ref support and error handling
 */
import { SchemaParser } from '../src/parsers/schema';
import { Schema } from '../src/types';
import { SchemaParseError, SchemaRefError } from '../src/errors';

describe('SchemaParser - Enhanced Tests', () => {
  describe('$ref resolution', () => {
    it('should resolve internal $ref to definitions', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          user: { $ref: '#/definitions/User' }
        },
        required: ['user'],
        definitions: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            },
            required: ['id', 'name']
          }
        }
      };

      const result = SchemaParser.parse(schema);
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('name');
      expect(typeof result.user.id).toBe('string');
      expect(typeof result.user.name).toBe('string');
    });

    it('should resolve nested $ref', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          post: { $ref: '#/definitions/Post' }
        },
        required: ['post'],
        definitions: {
          Post: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              author: { $ref: '#/definitions/User' }
            },
            required: ['id', 'author']
          },
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            },
            required: ['name']
          }
        }
      };

      const result = SchemaParser.parse(schema);
      expect(result.post).toHaveProperty('author');
      expect(result.post.author).toHaveProperty('name');
    });

    it('should handle circular $ref without infinite loop', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          person: { $ref: '#/definitions/Person' }
        },
        required: ['person'],
        definitions: {
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              friend: { $ref: '#/definitions/Person' }
            },
            required: ['name', 'friend']
          }
        }
      };

      const result = SchemaParser.parse(schema);
      expect(result.person).toHaveProperty('name');
      // Circular ref should be null to prevent infinite loop
      expect(result.person.friend).toBeNull();
    });

    it('should throw SchemaRefError for invalid $ref', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          user: { $ref: '#/definitions/NonExistent' }
        },
        required: ['user'],
        definitions: {}
      };

      expect(() => {
        SchemaParser.parse(schema);
      }).toThrow(SchemaRefError);
    });

    it('should handle external $ref (not supported)', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          user: { $ref: 'external-schema.json#/User' }
        },
        required: ['user']
      };

      const result = SchemaParser.parse(schema);
      expect(result.user).toBe('EXTERNAL_REF_NOT_SUPPORTED');
    });
  });

  describe('error handling', () => {
    it('should throw SchemaParseError for null schema', () => {
      expect(() => {
        SchemaParser.parse(null as any);
      }).toThrow(SchemaParseError);
      
      expect(() => {
        SchemaParser.parse(null as any);
      }).toThrow('Schema is required');
    });

    it('should throw SchemaParseError for undefined schema', () => {
      expect(() => {
        SchemaParser.parse(undefined as any);
      }).toThrow(SchemaParseError);
    });
  });

  describe('schema composition', () => {
    it('should handle oneOf correctly', () => {
      const schema: Schema = {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ]
      };

      const result = SchemaParser.parse(schema);
      const validTypes = ['string', 'number', 'boolean'];
      expect(validTypes).toContain(typeof result);
    });

    it('should handle anyOf correctly', () => {
      const schema: Schema = {
        anyOf: [
          { type: 'object', properties: { id: { type: 'string' } } },
          { type: 'null' }
        ]
      };

      const result = SchemaParser.parse(schema);
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should handle allOf correctly', () => {
      const schema: Schema = {
        allOf: [
          {
            type: 'object',
            properties: {
              id: { type: 'string' }
            },
            required: ['id']
          },
          {
            type: 'object',
            properties: {
              name: { type: 'string' }
            },
            required: ['name']
          }
        ]
      };

      const result = SchemaParser.parse(schema);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });
  });

  describe('complex schemas', () => {
    it('should handle deeply nested objects', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'string'
                  }
                },
                required: ['level3']
              }
            },
            required: ['level2']
          }
        },
        required: ['level1']
      };

      const result = SchemaParser.parse(schema);
      expect(result.level1?.level2?.level3).toBeDefined();
      expect(typeof result.level1?.level2?.level3).toBe('string');
    });

    it('should handle arrays of objects', () => {
      const schema: Schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' }
          },
          required: ['id', 'value']
        },
        minItems: 2,
        maxItems: 5
      };

      const result = SchemaParser.parse(schema);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
      
      result.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('value');
        expect(typeof item.id).toBe('string');
        expect(typeof item.value).toBe('number');
      });
    });

    it('should handle tuple arrays', () => {
      const schema: Schema = {
        type: 'array',
        items: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' }
        ]
      };

      const result = SchemaParser.parse(schema);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(typeof result[0]).toBe('string');
      if (result.length > 1) expect(typeof result[1]).toBe('number');
      if (result.length > 2) expect(typeof result[2]).toBe('boolean');
    });
  });

  describe('string formats', () => {
    it('should generate valid email format', () => {
      const schema: Schema = { type: 'string', format: 'email' };
      const result = SchemaParser.parse(schema);
      expect(result).toMatch(/^.+@.+\..+$/);
    });

    it('should generate valid UUID format', () => {
      const schema: Schema = { type: 'string', format: 'uuid' };
      const result = SchemaParser.parse(schema);
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate valid date-time format', () => {
      const schema: Schema = { type: 'string', format: 'date-time' };
      const result = SchemaParser.parse(schema);
      expect(new Date(result).toString()).not.toBe('Invalid Date');
    });

    it('should generate valid URI format', () => {
      const schema: Schema = { type: 'string', format: 'uri' };
      const result = SchemaParser.parse(schema);
      expect(result).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('number constraints', () => {
    it('should respect minimum and maximum', () => {
      const schema: Schema = {
        type: 'number',
        minimum: 10,
        maximum: 20
      };

      const result = SchemaParser.parse(schema);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(20);
    });

    it('should respect multipleOf', () => {
      const schema: Schema = {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        multipleOf: 5
      };

      const result = SchemaParser.parse(schema);
      expect(result % 5).toBe(0);
    });

    it('should handle exclusiveMinimum and exclusiveMaximum', () => {
      const schema: Schema = {
        type: 'number',
        minimum: 0,
        maximum: 10,
        exclusiveMinimum: true,
        exclusiveMaximum: true
      };

      const result = SchemaParser.parse(schema);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);
    });
  });

  describe('string constraints', () => {
    it('should respect minLength and maxLength', () => {
      const schema: Schema = {
        type: 'string',
        minLength: 5,
        maxLength: 10
      };

      const result = SchemaParser.parse(schema);
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle enum values', () => {
      const schema: Schema = {
        type: 'string',
        enum: ['red', 'green', 'blue']
      };

      const result = SchemaParser.parse(schema);
      expect(['red', 'green', 'blue']).toContain(result);
    });
  });

  describe('array constraints', () => {
    it('should respect minItems and maxItems', () => {
      const schema: Schema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 3,
        maxItems: 7
      };

      const result = SchemaParser.parse(schema);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(7);
    });
  });

  describe('object with required properties', () => {
    it('should always include required properties', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          required1: { type: 'string' },
          required2: { type: 'number' },
          optional: { type: 'boolean' }
        },
        required: ['required1', 'required2']
      };

      // Test multiple times since optional props are random
      for (let i = 0; i < 10; i++) {
        const result = SchemaParser.parse(schema);
        expect(result).toHaveProperty('required1');
        expect(result).toHaveProperty('required2');
      }
    });

    it('should sometimes include optional properties', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          required: { type: 'string' },
          optional1: { type: 'string' },
          optional2: { type: 'string' },
          optional3: { type: 'string' }
        },
        required: ['required']
      };

      // Generate multiple times and check if at least one includes optional props
      const results = Array.from({ length: 20 }, () => SchemaParser.parse(schema));
      const hasOptional = results.some(r => 
        Object.keys(r).some(k => k.startsWith('optional'))
      );
      
      expect(hasOptional).toBe(true);
    });
  });

  describe('multiple types', () => {
    it('should handle multiple types in schema', () => {
      const schema: Schema = {
        type: ['string', 'number', 'null'] as any
      };

      const results = Array.from({ length: 20 }, () => SchemaParser.parse(schema));
      const types = results.map(r => r === null ? 'null' : typeof r);
      const uniqueTypes = new Set(types);
      
      // Should generate at least 2 different types over 20 iterations
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(2);
    });
  });
});
