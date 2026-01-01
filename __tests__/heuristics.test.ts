import { SchemaParser } from '../src/parsers/schema';
import { Schema } from '../src/types';

describe('SchemaParser - Heuristics', () => {
  it('should generate realistic names based on property name', () => {
    const schema: Schema = { type: 'string' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'name');
    const commonNames = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown'];
    expect(commonNames).toContain(result);
  });

  it('should generate realistic emails based on property name', () => {
    const schema: Schema = { type: 'string' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'email');
    expect(result).toMatch(/^user\d+@example\.com$/);
  });

  it('should generate realistic ages based on property name', () => {
    const schema: Schema = { type: 'integer' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'age');
    expect(result).toBeGreaterThanOrEqual(18);
    expect(result).toBeLessThanOrEqual(78);
  });

  it('should generate realistic prices based on property name', () => {
    const schema: Schema = { type: 'number' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'price');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
    // Should have up to 2 decimal places
    const str = result.toString();
    if (str.includes('.')) {
      expect(str.split('.')[1].length).toBeLessThanOrEqual(2);
    }
  });

  it('should generate realistic phone numbers', () => {
    const schema: Schema = { type: 'string' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'phoneNumber');
    expect(result).toMatch(/^\+1-555-\d{3}-\d{4}$/);
  });

  it('should generate realistic cities', () => {
    const schema: Schema = { type: 'string' };
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'city');
    const commonCities = ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'];
    expect(commonCities).toContain(result);
  });

  it('should generate realistic dates and times with formats', () => {
    expect(SchemaParser.parse({ type: 'string', format: 'date' })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(SchemaParser.parse({ type: 'string', format: 'time' })).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should use resource name as hint in server generator context', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' }
      }
    };
    // Mocking the behavior where resource name is passed
    const result = SchemaParser.parse(schema, undefined, new Set(), false, 'users');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(typeof result.id).toBe('string');
    // For 'users' resource, the 'name' property inside should still be treated as a name
    expect(['John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown']).toContain(result.name);
  });
});
