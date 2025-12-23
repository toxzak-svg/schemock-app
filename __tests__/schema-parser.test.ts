import { SchemaParser } from '../src/parsers/schema';
import { Schema } from '../src/types';

describe('SchemaParser', () => {
  describe('parse', () => {
    it('should parse a simple string schema', () => {
      const schema: Schema = { type: 'string' };
      const result = SchemaParser.parse(schema);
      expect(typeof result).toBe('string');
    });

    it('should parse a string schema with format', () => {
      const schema: Schema = { 
        type: 'string', 
        format: 'email' 
      };
      const result = SchemaParser.parse(schema);
      expect(result).toContain('@');
      expect(result).toContain('.');
    });

    it('should parse a number schema', () => {
      const schema: Schema = { 
        type: 'number',
        minimum: 10,
        maximum: 20
      };
      const result = SchemaParser.parse(schema);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(20);
    });

    it('should parse a boolean schema', () => {
      const schema: Schema = { type: 'boolean' };
      const result = SchemaParser.parse(schema);
      expect(typeof result).toBe('boolean');
    });

    it('should parse an array schema', () => {
      const schema: Schema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 5
      };
      const result = SchemaParser.parse(schema);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
      (result as string[]).forEach((item: string) => {
        expect(typeof item).toBe('string');
      });
    });

    it('should parse an object schema', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0, maximum: 120 },
          active: { type: 'boolean' }
        },
        required: ['id', 'name']
      };
      
      const result = SchemaParser.parse(schema);
      expect(typeof result).toBe('object');
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      
      if ('age' in result) {
        expect(typeof result.age).toBe('number');
        expect(result.age).toBeGreaterThanOrEqual(0);
        expect(result.age).toBeLessThanOrEqual(120);
      }
      
      if ('active' in result) {
        expect(typeof result.active).toBe('boolean');
      }
    });
  });
});
