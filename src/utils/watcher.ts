import { EventEmitter } from 'events';
import { FileError } from '../errors';
import chalk from 'chalk';

// Dynamically import chokidar to avoid ESM issues in pkg
let chokidarModule: any = null;

async function getChokidar() {
  if (!chokidarModule) {
    try {
      chokidarModule = await import('chokidar');
    } catch (error) {
      console.warn('Chokidar not available, file watching disabled');
      return null;
    }
  }
  return chokidarModule?.default || chokidarModule;
}

/**
 * File watcher for schema hot-reload
 */
export class SchemaWatcher extends EventEmitter {
  private watcher: any | null = null;
  private watchedFiles: Set<string> = new Set();

  /**
   * Start watching a file for changes
   * @param filePath - Absolute path to the file to watch
   */
  async watch(filePath: string): Promise<void> {
    if (this.watchedFiles.has(filePath)) {
      console.warn(chalk.yellow(`Already watching: ${filePath}`));
      return;
    }

    const chokidar = await getChokidar();
    if (!chokidar) {
      console.warn(chalk.yellow('File watching is not available in this environment'));
      return;
    }

    if (!this.watcher) {
      this.watcher = chokidar.watch([], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      });

      this.watcher
        .on('change', (path: string) => {
          console.log(chalk.blue(`📝 Schema file changed: ${path}`));
          this.emit('change', path);
        })
        .on('error', (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(chalk.red(`❌ Watcher error: ${errorMessage}`));
          this.emit('error', new FileError(
            `File watcher error: ${errorMessage}`,
            filePath,
            'watch'
          ));
        });
    }

    this.watcher.add(filePath);
    this.watchedFiles.add(filePath);
    console.log(chalk.green(`👁️  Watching for changes: ${filePath}`));
  }

  /**
   * Stop watching a file
   * @param filePath - Path to stop watching
   */
  unwatch(filePath: string): void {
    if (!this.watchedFiles.has(filePath)) {
      return;
    }

    if (this.watcher) {
      this.watcher.unwatch(filePath);
      this.watchedFiles.delete(filePath);
      console.log(chalk.gray(`Stopped watching: ${filePath}`));
    }
  }

  /**
   * Stop watching all files and cleanup
   */
  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.watchedFiles.clear();
      console.log(chalk.gray('File watcher closed'));
    }
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }

  /**
   * Check if a file is being watched
   */
  isWatching(filePath: string): boolean {
    return this.watchedFiles.has(filePath);
  }
}

/**
 * Create a schema watcher instance
 */
export function createWatcher(): SchemaWatcher {
  return new SchemaWatcher();
}
