// Mock chokidar for Jest tests
export class FSWatcher {
  private handlers: Record<string, Function[]> = {};

  on(event: string, handler: Function) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
    return this;
  }

  add(path: string) {
    return this;
  }

  unwatch(path: string) {
    return this;
  }

  close() {
    return Promise.resolve();
  }

  // Helper for tests
  emitChange(path: string) {
    if (this.handlers['change']) {
      this.handlers['change'].forEach(handler => handler(path));
    }
  }

  emitError(error: Error) {
    if (this.handlers['error']) {
      this.handlers['error'].forEach(handler => handler(error));
    }
  }
}

const watcher = new FSWatcher();

export default {
  watch: jest.fn(() => watcher)
};

export { watcher };
