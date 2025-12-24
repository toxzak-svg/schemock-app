/**
 * Performance Testing Suite for Schemock
 * 
 * Tests server performance under load:
 * - Requests per second
 * - Response latency (p50, p95, p99)
 * - Memory usage
 * - Concurrent request handling
 */

import { createMockServer } from '../src';
import { ServerGenerator } from '../src/generators/server';
import axios from 'axios';

interface PerformanceMetrics {
  requestsPerSecond: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  startMemory: number;
  endMemory: number;
  memoryIncrease: number;
}

describe('Performance Tests', () => {
  let server: ServerGenerator;
  const PORT = 3333;
  const BASE_URL = `http://localhost:${PORT}`;

  const testSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 18, maximum: 100 },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 5
      }
    },
    required: ['id', 'name', 'email', 'isActive']
  };

  beforeAll(async () => {
    server = createMockServer(testSchema, {
      port: PORT,
      cors: true,
      logLevel: 'error' // Reduce noise during tests
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  async function measurePerformance(
    concurrency: number,
    totalRequests: number
  ): Promise<PerformanceMetrics> {
    const latencies: number[] = [];
    let successCount = 0;
    let failCount = 0;

    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Create batches for concurrent requests
    const batchSize = concurrency;
    const batches = Math.ceil(totalRequests / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const requestsInBatch = Math.min(batchSize, totalRequests - batch * batchSize);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < requestsInBatch; i++) {
        const requestStart = Date.now();
        
        const promise = axios
          .get(`${BASE_URL}/api/data`)
          .then(() => {
            const latency = Date.now() - requestStart;
            latencies.push(latency);
            successCount++;
          })
          .catch(() => {
            failCount++;
          });

        promises.push(promise);
      }

      await Promise.all(promises);
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Calculate metrics
    const duration = (endTime - startTime) / 1000; // seconds
    latencies.sort((a, b) => a - b);

    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    return {
      requestsPerSecond: totalRequests / duration,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[p50Index] || 0,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount,
      startMemory,
      endMemory,
      memoryIncrease: endMemory - startMemory
    };
  }

  describe('Throughput Tests', () => {
    it('should handle 100 sequential requests', async () => {
      const metrics = await measurePerformance(1, 100);

      console.log('\n=== 100 Sequential Requests ===');
      console.log(`Requests/sec: ${metrics.requestsPerSecond.toFixed(2)}`);
      console.log(`Avg Latency: ${metrics.averageLatency.toFixed(2)}ms`);
      console.log(`P95 Latency: ${metrics.p95Latency}ms`);
      console.log(`Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2)}%`);

      expect(metrics.successfulRequests).toBe(100);
      expect(metrics.failedRequests).toBe(0);
    }, 30000);

    it('should handle 100 concurrent requests (10 at a time)', async () => {
      const metrics = await measurePerformance(10, 100);

      console.log('\n=== 100 Concurrent Requests (10 at a time) ===');
      console.log(`Requests/sec: ${metrics.requestsPerSecond.toFixed(2)}`);
      console.log(`Avg Latency: ${metrics.averageLatency.toFixed(2)}ms`);
      console.log(`P95 Latency: ${metrics.p95Latency}ms`);
      console.log(`Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2)}%`);

      expect(metrics.successfulRequests).toBe(100);
      expect(metrics.failedRequests).toBe(0);
    }, 30000);

    it('should handle 500 concurrent requests (50 at a time)', async () => {
      const metrics = await measurePerformance(50, 500);

      console.log('\n=== 500 Concurrent Requests (50 at a time) ===');
      console.log(`Requests/sec: ${metrics.requestsPerSecond.toFixed(2)}`);
      console.log(`Avg Latency: ${metrics.averageLatency.toFixed(2)}ms`);
      console.log(`P95 Latency: ${metrics.p95Latency}ms`);
      console.log(`Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2)}%`);

      expect(metrics.successfulRequests).toBe(500);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.requestsPerSecond).toBeGreaterThan(100); // At least 100 req/s
    }, 60000);
  });

  describe('Latency Tests', () => {
    it('should maintain low latency under load', async () => {
      const metrics = await measurePerformance(20, 200);

      console.log('\n=== Latency Test (200 requests, 20 concurrent) ===');
      console.log(`Min Latency: ${metrics.minLatency}ms`);
      console.log(`P50 Latency: ${metrics.p50Latency}ms`);
      console.log(`P95 Latency: ${metrics.p95Latency}ms`);
      console.log(`P99 Latency: ${metrics.p99Latency}ms`);
      console.log(`Max Latency: ${metrics.maxLatency}ms`);

      // Target: P95 < 100ms
      expect(metrics.p95Latency).toBeLessThan(100);
      expect(metrics.averageLatency).toBeLessThan(50);
    }, 30000);
  });

  describe('Memory Tests', () => {
    it('should not leak memory under sustained load', async () => {
      const metrics = await measurePerformance(10, 1000);

      console.log('\n=== Memory Test (1000 requests) ===');
      console.log(`Start Memory: ${(metrics.startMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`End Memory: ${(metrics.endMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory Increase: ${(metrics.memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be reasonable (< 50MB for 1000 requests)
      expect(metrics.memoryIncrease / 1024 / 1024).toBeLessThan(50);
    }, 60000);
  });

  describe('Reliability Tests', () => {
    it('should maintain 100% success rate', async () => {
      const metrics = await measurePerformance(25, 250);

      console.log('\n=== Reliability Test (250 requests, 25 concurrent) ===');
      console.log(`Successful: ${metrics.successfulRequests}`);
      console.log(`Failed: ${metrics.failedRequests}`);
      console.log(`Success Rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2)}%`);

      expect(metrics.failedRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(250);
    }, 30000);
  });

  describe('Different HTTP Methods', () => {
    it('should handle POST requests efficiently', async () => {
      const latencies: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await axios.post(`${BASE_URL}/api/data`, {
          test: 'data',
          value: i
        });
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log('\n=== POST Request Performance ===');
      console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);

      expect(avgLatency).toBeLessThan(50);
    }, 15000);
  });
});
