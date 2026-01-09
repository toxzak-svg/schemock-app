import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';

describe('Preset Scenarios', () => {
  let generator: ServerGenerator;
  let server: any;
  let port: number;
  let originalRandom: () => number;

  beforeEach(() => {
    // Store original Math.random
    originalRandom = Math.random;
  });

  afterEach(async () => {
    // Restore original Math.random
    Math.random = originalRandom;
    if (generator) {
      await generator.stop();
    }
    if (server) {
      server.close();
    }
  });

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
    // Mock Math.random to return 0 for deterministic delay (1000ms)
    Math.random = jest.fn(() => 0);

    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'slow' });
    await generator.start();
    port = (generator as any).server.address().port;

    const start = Date.now();
    const response = await fetch(`http://localhost:${port}/api/tests`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    // With Math.random() = 0, delay = 1000 + 0 = 1000ms
    expect(duration).toBeGreaterThanOrEqual(1000);
    expect(duration).toBeLessThan(1500); // Should be close to 1000ms, not much more
  });

  it('should return errors in error-heavy scenario', async () => {
    // Mock Math.random to return 0.2 (less than 0.3) to ensure error is triggered
    let callCount = 0;
    Math.random = jest.fn(() => {
      callCount++;
      // First call returns 0.2 to trigger error (0.2 < 0.3)
      // Subsequent calls return 0.9 to avoid more errors
      return callCount === 1 ? 0.2 : 0.9;
    });

    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'error-heavy' });
    await generator.start();
    port = (generator as any).server.address().port;

    const response = await fetch(`http://localhost:${port}/api/tests`);

    // With Math.random() = 0.2 (< 0.3), error should be triggered
    expect(response.status).toBeGreaterThanOrEqual(400);
    const data = await response.json() as any;
    expect(data.error).toBe('ScenarioError');
  });

  it('should apply both delays and errors in sad-path scenario', async () => {
    // Mock Math.random to return 0.2 for both delay and error checks
    // First call: delay check (0.2 < 1, so delay = 1000 + 0.2 * 2000 = 1400ms)
    // Second call: error check (0.2 < 0.3, so error is triggered)
    let callCount = 0;
    Math.random = jest.fn(() => {
      callCount++;
      return 0.2;
    });

    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'sad-path' });
    await generator.start();
    port = (generator as any).server.address().port;

    const start = Date.now();
    const response = await fetch(`http://localhost:${port}/api/tests`);
    const duration = Date.now() - start;

    // With Math.random() = 0.2:
    // - Delay: 1000 + 0.2 * 2000 = 1400ms
    // - Error: 0.2 < 0.3, so error is triggered
    expect(duration).toBeGreaterThanOrEqual(1000);
    expect(response.status).toBeGreaterThanOrEqual(400);
    const data = await response.json() as any;
    expect(data.error).toBe('ScenarioError');
  });
});
