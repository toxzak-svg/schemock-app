import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';

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
    let errorCount = 0;
    // Make up to 20 requests to catch at least one error (30% chance)
    for (let i = 0; i < 20; i++) {
      const response = await fetch(`http://localhost:${port}/api/tests`);
      if (response.status >= 400) {
        hasError = true;
        errorCount++;
        const data = await response.json() as any;
        expect(data.error).toBe('ScenarioError');
        break;
      }
    }

    // Diagnostic logging for flakiness
    console.log(`[DIAGNOSTIC] error-heavy scenario: Made 20 requests, found ${errorCount} errors, hasError=${hasError}`);

    expect(hasError).toBe(true);
  });

  it('should apply both delays and errors in sad-path scenario', async () => {
    generator = ServerGenerator.generateFromSchema(schema, { port: 0, scenario: 'sad-path' });
    await generator.start();
    port = (generator as any).server.address().port;

    let hasError = false;
    let hasDelay = false;
    let errorCount = 0;
    let delayCount = 0;

    for (let i = 0; i < 15; i++) {
      const start = Date.now();
      const response = await fetch(`http://localhost:${port}/api/tests`);
      const duration = Date.now() - start;

      if (duration >= 1000) {
        hasDelay = true;
        delayCount++;
      }

      if (response.status >= 400) {
        hasError = true;
        errorCount++;
      }

      if (hasError && hasDelay) break;
    }

    // Diagnostic logging for flakiness
    console.log(`[DIAGNOSTIC] sad-path scenario: Made 15 requests, found ${errorCount} errors, ${delayCount} delays, hasError=${hasError}, hasDelay=${hasDelay}`);

    expect(hasError).toBe(true);
    expect(hasDelay).toBe(true);
  }, 30000); // Increase timeout to 30 seconds
});
