import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';
import * as http from 'http';
import express from 'express';
import { AddressInfo } from 'net';

describe('ServerGenerator', () => {
  let server: http.Server | null = null;

  afterEach((done) => {
    if (server) {
      server.close(() => {
        server = null;
        done();
      });
    } else {
      done();
    }
  });

  it('should start a server with the specified port', (done) => {
    const schema: Schema = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    };

    const generator = ServerGenerator.generateFromSchema(schema, { port: 0 });
    server = generator.getApp().listen(0, async () => {
      try {
        const address = server!.address() as AddressInfo;
        const port = address.port;

        const response = await fetch(`http://localhost:${port}/api/data`);
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
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should support POST requests', (done) => {
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

    // Start the server and wait for it to be listening
    server = testApp.listen(0, async () => {
      try {
        const address = server!.address() as AddressInfo;
        const port = address.port;
        const testUrl = `http://localhost:${port}/api/items`;

        // Make the request
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test Item', completed: false })
        });

        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('id', 'test-id');
        expect(data.data).toHaveProperty('title', 'Test Item');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
