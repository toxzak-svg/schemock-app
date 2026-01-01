import { ServerGenerator } from '../src/generators/server';
import { SchemaParser } from '../src/parsers/schema';
import { validateSchema, validateData } from '../src/utils/validation';
import { Schema } from '../src/types';
import request from 'supertest';

describe('New Features: Scenarios and Ergonomics', () => {
  describe('Preset Scenarios', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    };

    it('should respect the slow scenario with delays', async () => {
      const server = ServerGenerator.generateFromSchema(schema, { scenario: 'slow' });
      // We can't easily test timing in unit tests without mocking timers, 
      // but we can check if the config is correctly set.
      expect(server.getConfig().server.scenario).toBe('slow');
    });

    it('should respect the error-heavy scenario', async () => {
      const server = ServerGenerator.generateFromSchema(schema, { scenario: 'error-heavy' });
      expect(server.getConfig().server.scenario).toBe('error-heavy');
    });
  });

  describe('Schema Validation and Strict Mode', () => {
    it('should validate valid schema', () => {
      const schema: Schema = { type: 'object', properties: { id: { type: 'string' } } };
      expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should throw on invalid schema type', () => {
      const schema: any = { type: 'invalid' };
      expect(() => validateSchema(schema)).toThrow(/Invalid schema type/);
    });

    it('should enforce strict mode for objects', () => {
      const schema: Schema = { type: 'object' }; // Missing properties
      expect(() => validateSchema(schema, true)).toThrow(/Strict mode: object schema must define properties/);
    });

    it('should enforce strict mode for arrays', () => {
      const schema: Schema = { type: 'array' }; // Missing items
      expect(() => validateSchema(schema, true)).toThrow(/Strict mode: array schema must define items/);
    });
  });

  describe('Data Validation', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        id: { type: 'string', minLength: 5 },
        age: { type: 'integer', minimum: 18 }
      },
      required: ['id']
    };

    it('should validate correct data', () => {
      const data = { id: '12345', age: 20 };
      expect(() => validateData(data, schema)).not.toThrow();
    });

    it('should throw on missing required field', () => {
      const data = { age: 20 };
      expect(() => validateData(data, schema)).toThrow(/Missing required field: id/);
    });

    it('should throw on too short string', () => {
      const data = { id: '123' };
      expect(() => validateData(data, schema)).toThrow(/String too short/);
    });

    it('should throw on too small number', () => {
      const data = { id: '12345', age: 10 };
      expect(() => validateData(data, schema)).toThrow(/Number too small/);
    });
  });

  describe('Strict Mode Server Behavior', () => {
    const schema: Schema = {
      title: 'User',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['name']
    };

    it('should always include required properties in strict mode', () => {
      const mockData = SchemaParser.parse(schema, undefined, new Set(), true);
      expect(mockData).toHaveProperty('name');
    });

    it('should validate request body in strict mode', async () => {
      const serverGenerator = ServerGenerator.generateFromSchema(schema, { strict: true });
      const app = serverGenerator.getApp();
      
      // Valid POST
      const res1 = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe' });
      expect(res1.status).toBe(201);

      // Invalid POST (missing required 'name')
      const res2 = await request(app)
        .post('/api/users')
        .send({ age: 30 });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('ValidationError');
    });
  });
});
