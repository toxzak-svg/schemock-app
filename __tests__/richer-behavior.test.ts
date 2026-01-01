import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';
import nodeFetch from 'node-fetch';
const fetch = nodeFetch.default;

describe('Richer Dynamic Behavior', () => {
  let generator: ServerGenerator;
  let server: any;
  let port: number;

  beforeAll(async () => {
    const schema: Schema = {
      title: 'User',
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      required: ['id', 'name', 'email']
    };

    generator = ServerGenerator.generateFromSchema(schema, { port: 0 });
    await generator.start();
    const address = (generator as any).server.address();
    port = address.port;
  });

  afterAll(async () => {
    await generator.stop();
  });

  it('should support parameterized routes and return different data per ID', async () => {
    // Currently, /api/users/:id might not be automatically generated unless using x-schemock-routes
    // or if we change how generateFromSchema works.
    
    // Let's test with a custom route first to see current behavior
    const customSchema: Schema = {
      'x-schemock-routes': [
        {
          path: '/api/users/:id',
          method: 'get',
          response: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      ]
    };
    
    const customGenerator = ServerGenerator.generateFromSchema(customSchema, { port: 0 });
    await customGenerator.start();
    const customPort = (customGenerator as any).server.address().port;

    try {
      const res1 = await fetch(`http://localhost:${customPort}/api/users/1`);
      const data1 = await res1.json() as any;
      
      const res2 = await fetch(`http://localhost:${customPort}/api/users/2`);
      const data2 = await res2.json() as any;

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      expect(data1.id).toBe('1');
      expect(data2.id).toBe('2');

      // Test consistency: requesting the same ID again should return the same data
      const res1_again = await fetch(`http://localhost:${customPort}/api/users/1`);
      const data1_again = await res1_again.json() as any;
      expect(data1_again).toEqual(data1);
    } finally {
      await customGenerator.stop();
    }
  });

  it('should support stateful mocks (POST stores, GET lists)', async () => {
    const schema: Schema = {
      title: 'Item',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    };

    const statefulGenerator = ServerGenerator.generateFromSchema(schema, { port: 0 });
    await statefulGenerator.start();
    const statefulPort = (statefulGenerator as any).server.address().port;

    try {
      // 1. GET lists should initially be empty or have default items
      const getRes1 = await fetch(`http://localhost:${statefulPort}/api/items`);
      const list1 = await getRes1.json() as any;
      
      // 2. POST to store an item
      const newItem = { id: 'item-1', name: 'Test Item' };
      const postRes = await fetch(`http://localhost:${statefulPort}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      expect(postRes.status).toBe(201);

      // 3. GET list should now contain the item
      const getRes2 = await fetch(`http://localhost:${statefulPort}/api/items`);
      const list2 = await getRes2.json() as any;
      
      // This is expected to FAIL currently because the server is stateless
      expect(list2.data).toContainEqual(expect.objectContaining(newItem));
      
      // 4. GET by ID should return the item
      const getByIdRes = await fetch(`http://localhost:${statefulPort}/api/items/item-1`);
      const item = await getByIdRes.json() as any;
      expect(item.data.id).toBe('item-1');
      expect(item.data.name).toBe('Test Item');

    } finally {
      await statefulGenerator.stop();
    }
  });
});
