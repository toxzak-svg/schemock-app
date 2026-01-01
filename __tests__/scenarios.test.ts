import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';
import * as nodeFetch from 'node-fetch';
const fetch = nodeFetch.default;

describe('Preset Scenarios', () => {
  let generator: ServerGenerator;
  let server: any;
  let port: number;

  const schema: Schema = {
    title: 'Test',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' }
    }
  };

  afterEach(async () => {
    if (generator) {
      await generator.stop();
    }
    if (server) {
      server.close();
    }
  });

  it('should handle happy-path scenario normally', async () => {
    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'happy-path' });
    await generator.start();
    port = (generator as any).server.address().port;

    const start = Date.now();
    const response = await fetch(`http://localhost:${port}/api/tests`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500); // Should be fast
  });

  it('should apply delays in slow scenario', async () => {
    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'slow' });
    await generator.start();
    port = (generator as any).server.address().port;

    const start = Date.now();
    const response = await fetch(`http://localhost:${port}/api/tests`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeGreaterThanOrEqual(1000); // We added 1000ms + random
  });

  it('should return errors in error-heavy scenario', async () => {
    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'error-heavy' });
    await generator.start();
    port = (generator as any).server.address().port;

    let hasError = false;
    // Make up to 20 requests to catch at least one error (30% chance)
    for (let i = 0; i < 20; i++) {
      const response = await fetch(`http://localhost:${port}/api/tests`);
      if (response.status >= 400) {
        hasError = true;
        const data = await response.json() as any;
        expect(data.error).toBe('ScenarioError');
        break;
      }
    }

    expect(hasError).toBe(true);
  });

  it('should apply both delays and errors in sad-path scenario', async () => {
    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'sad-path' });
    await generator.start();
    port = (generator as any).server.address().port;

    let hasError = false;
    let hasDelay = false;

    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      const response = await fetch(`http://localhost:${port}/api/tests`);
      const duration = Date.now() - start;

      if (duration >= 1000) {
        hasDelay = true;
      }

      if (response.status >= 400) {
        hasError = true;
      }

      if (hasError && hasDelay) break;
    }

    expect(hasError).toBe(true);
    expect(hasDelay).toBe(true);
  });
});
