import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';
import * as nodeFetch from 'node-fetch';
const fetch = nodeFetch.default;

const TEST_PORT = 3005;

describe('Multi-endpoint DSL', () => {
  let generator: ServerGenerator;

  afterEach(async () => {
    if (generator && generator.isRunning()) {
      await generator.stop();
    }
  });

  it('should support multiple endpoints defined in x-schemock-routes', async () => {
    const schema: Schema = {
      type: 'object',
      'x-schemock-routes': [
        {
          path: '/api/users',
          method: 'get',
          response: {
            type: 'array',
            items: { $ref: '#/definitions/User' },
            minItems: 2,
            maxItems: 2
          }
        },
        {
          path: '/api/users/:id',
          method: 'get',
          response: { $ref: '#/definitions/User' }
        },
        {
          path: '/api/status',
          method: 'get',
          response: { status: 'ok', version: '1.0.0' }
        }
      ],
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

    generator = ServerGenerator.generateFromSchema(schema, { port: TEST_PORT });
    await generator.start();

    // Test /api/users
    const usersResponse = await fetch(`http://localhost:${TEST_PORT}/api/users`);
    const usersData = await usersResponse.json() as any[];
    expect(usersResponse.status).toBe(200);
    expect(Array.isArray(usersData)).toBe(true);
    expect(usersData.length).toBe(2);
    expect(usersData[0]).toHaveProperty('id');
    expect(usersData[0]).toHaveProperty('name');

    // Test /api/users/:id
    const userResponse = await fetch(`http://localhost:${TEST_PORT}/api/users/123`);
    const userData = await userResponse.json() as any;
    expect(userResponse.status).toBe(200);
    expect(userData).toHaveProperty('id');
    expect(userData).toHaveProperty('name');

    // Test /api/status (non-schema response)
    const statusResponse = await fetch(`http://localhost:${TEST_PORT}/api/status`);
    const statusData = await statusResponse.json() as any;
    expect(statusResponse.status).toBe(200);
    expect(statusData).toHaveProperty('status', 'ok');
    expect(statusData).toHaveProperty('version', '1.0.0');
    // Note: May include _meta metadata
  });

  it('should support custom status codes and delays', async () => {
    const schema: Schema = {
      'x-schemock-routes': [
        {
          path: '/api/created',
          method: 'post',
          response: { success: true },
          statusCode: 201
        },
        {
          path: '/api/slow',
          method: 'get',
          response: { message: 'slow' },
          delay: 100
        }
      ]
    };

    generator = ServerGenerator.generateFromSchema(schema, { port: TEST_PORT + 1 });
    await generator.start();

    // Test custom status code
    const createdResponse = await fetch(`http://localhost:${TEST_PORT + 1}/api/created`, { method: 'POST' });
    expect(createdResponse.status).toBe(201);

    // Test delay
    const start = Date.now();
    await fetch(`http://localhost:${TEST_PORT + 1}/api/slow`);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(100);
  });
});
