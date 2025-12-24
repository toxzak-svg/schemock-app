import { SchemaWatcher } from '../src/utils/watcher';

// Mock chokidar
jest.mock('chokidar', () => ({
  __esModule: true,
  default: {
    watch: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      add: jest.fn(),
      unwatch: jest.fn(),
      close: jest.fn(() => Promise.resolve())
    }))
  }
}));

describe('SchemaWatcher', () => {
  let watcher: SchemaWatcher;

  beforeEach(() => {
    watcher = new SchemaWatcher();
  });

  afterEach(async () => {
    await watcher.close();
  });

  describe('watch()', () => {
    it('should watch a file for changes', () => {
      const testFile = '/test/schema.json';
      watcher.watch(testFile);
      
      expect(watcher.isWatching(testFile)).toBe(true);
      expect(watcher.getWatchedFiles()).toContain(testFile);
    });

    it('should not watch same file twice', () => {
      const testFile = '/test/schema.json';
      watcher.watch(testFile);
      watcher.watch(testFile); // Second call
      
      expect(watcher.getWatchedFiles().length).toBe(1);
    });

    it('should handle multiple files', () => {
      watcher.watch('/test/schema1.json');
      watcher.watch('/test/schema2.json');
      
      expect(watcher.getWatchedFiles().length).toBe(2);
    });
  });

  describe('unwatch()', () => {
    it('should stop watching a file', () => {
      const testFile = '/test/schema.json';
      watcher.watch(testFile);
      expect(watcher.isWatching(testFile)).toBe(true);
      
      watcher.unwatch(testFile);
      expect(watcher.isWatching(testFile)).toBe(false);
    });

    it('should handle unwatching non-watched file', () => {
      expect(() => {
        watcher.unwatch('/non/existent/file.json');
      }).not.toThrow();
    });
  });

  describe('close()', () => {
    it('should close watcher and clear all watched files', async () => {
      watcher.watch('/test/schema.json');
      expect(watcher.getWatchedFiles().length).toBe(1);
      
      await watcher.close();
      expect(watcher.getWatchedFiles().length).toBe(0);
    });
  });

  describe('getWatchedFiles()', () => {
    it('should return list of watched files', () => {
      expect(watcher.getWatchedFiles()).toEqual([]);
      
      watcher.watch('/test/schema.json');
      expect(watcher.getWatchedFiles()).toEqual(['/test/schema.json']);
    });

    it('should return empty array when no files watched', () => {
      expect(watcher.getWatchedFiles()).toEqual([]);
    });
  });

  describe('isWatching()', () => {
    it('should return true for watched files', () => {
      const testFile = '/test/schema.json';
      watcher.watch(testFile);
      expect(watcher.isWatching(testFile)).toBe(true);
    });

    it('should return false for non-watched files', () => {
      expect(watcher.isWatching('/some/file.json')).toBe(false);
    });

    it('should return false after unwatching', () => {
      const testFile = '/test/schema.json';
      watcher.watch(testFile);
      watcher.unwatch(testFile);
      expect(watcher.isWatching(testFile)).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit change events', (done) => {
      watcher.on('change', (path: string) => {
        expect(path).toBe('/test/schema.json');
        done();
      });

      // Manually trigger change event
      watcher.emit('change', '/test/schema.json');
    });

    it('should emit error events', (done) => {
      watcher.on('error', (error: Error) => {
        expect(error).toBeDefined();
        done();
      });

      // Manually trigger error event
      watcher.emit('error', new Error('Test error'));
    });
  });
});
