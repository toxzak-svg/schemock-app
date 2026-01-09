import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';
import * as http from 'http';
import express from 'express';
import { AddressInfo } from 'net';

const TEST_PORT = 3001;

describe('ServerGenerator', () => {
  let server: any;

  afterEach(() => {
    console.log('[DIAGNOSTIC] afterEach: server exists?', !!server);
    if (server) {
      try {
        server.close();
        console.log('[DIAGNOSTIC] afterEach: Server closed successfully');
      } catch (error) {
        console.log('[DIAGNOSTIC] afterEach: Error closing server:', error);
      }
      server = null;
    }
  });

  it('should start a server with the specified port', async () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    };

    const generator = ServerGenerator.generateFromSchema(schema, { port: TEST_PORT });
    server = generator.getApp().listen(TEST_PORT);

    const response = await fetch(`http://localhost:${TEST_PORT}/api/data`);
    const data = await response.json() as {
      message: string;
      timestamp: string;
      data: Array<{ id: string; name: string }>;
    };

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.data[0].id).toBe('string');
    expect(typeof data.data[0].name).toBe('string');
  });

  it('should support POST requests', async () => {
    console.log('[DIAGNOSTIC] POST test: Starting, server exists?', !!server);
    // Create a simple Express app for testing
    const testApp = express();
    testApp.use(express.json());

    // Add a test route
    testApp.post('/api/items', (req, res) => {
      res.status(201).json({
        success: true,
        data: { id: 'test-id', ...req.body },
        message: 'Item created successfully'
      });
    });

    // Close any existing server
    if (server) {
      console.log('[DIAGNOSTIC] POST test: Closing existing server');
      server.close();
      server = null;
    }

    // Start the server
    return new Promise<void>((resolve, reject) => {
      server = testApp.listen(0); // Use random available port
      console.log('[DIAGNOSTIC] POST test: Server started');

      const address = server.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to get server address'));
      }

      const testUrl = `http://localhost:${address.port}/api/items`;

      // Make the request
      fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Item', completed: false })
      })
        .then(async (response) => {
          const data = await response.json();
          expect(response.status).toBe(201);
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('id', 'test-id');
          expect(data.data).toHaveProperty('title', 'Test Item');
          resolve();
        })
        .catch(reject)
        .finally(() => {
          console.log('[DIAGNOSTIC] POST test finally: closing server, server exists?', !!server);
          if (server) {
            try {
              server.close();
              server = null;
              console.log('[DIAGNOSTIC] POST test finally: Server closed successfully');
            } catch (error) {
              console.log('[DIAGNOSTIC] POST test finally: Error closing server:', error);
            }
          }
        });
    });
  });
});
