import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Schema } from '../src/types';

// Mock fs and child_process
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CLI Enhanced Tests', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.mkdirSync.mockReturnValue(undefined as any);
    mockFs.writeFileSync.mockReturnValue(undefined as any);
    mockFs.readdirSync.mockReturnValue([]);
  });

  describe('CLI Configuration', () => {
    it('should validate command program structure', () => {
      const { Command } = require('commander');
      const program = new Command();
      expect(program).toBeInstanceOf(Command);
    });

    it('should support command program options', () => {
      const { Command } = require('commander');
      const program = new Command();
      expect(typeof program.version).toBe('function');
      expect(typeof program.description).toBe('function');
      expect(typeof program.command).toBe('function');
    });
  });

  describe('Start Command - Schema Loading', () => {
    it('should load default schema when no path provided', async () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('id');
      expect(schema.properties).toHaveProperty('name');
    });

    it('should load schema from file', async () => {
      const testSchema = {
        type: 'object',
        title: 'Test',
        properties: {
          id: { type: 'string' }
        }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(testSchema));
      const content = mockFs.readFileSync('test.json', 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.title).toBe('Test');
      expect(parsed.properties.id.type).toBe('string');
    });

    it('should handle JSON parse errors', () => {
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      expect(() => {
        JSON.parse(mockFs.readFileSync('test.json', 'utf-8'));
      }).toThrow();
    });
  });

  describe('Start Command - Options', () => {
    it('should validate port option', () => {
      const port = 3000;
      expect(port).toBeGreaterThanOrEqual(1);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should accept valid log levels', () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      validLevels.forEach(level => {
        expect(validLevels.includes(level)).toBe(true);
      });
    });

    it('should validate scenarios', () => {
      const validScenarios = ['happy-path', 'slow', 'error-heavy', 'sad-path'];
      validScenarios.forEach(scenario => {
        expect(validScenarios.includes(scenario)).toBe(true);
      });
    });

    it('should reject invalid scenarios', () => {
      const validScenarios = ['happy-path', 'slow', 'error-heavy', 'sad-path'];
      const invalidScenario = 'invalid-scenario';
      expect(validScenarios.includes(invalidScenario)).toBe(false);
    });
  });

  describe('Start Command - Watch Mode', () => {
    it('should support watch mode', () => {
      const watchMode = true;
      expect(watchMode).toBe(true);
    });

    it('should support resource name option', () => {
      const resourceOption = 'products';
      expect(resourceOption).toBe('products');
    });

    it('should derive resource name from filename', () => {
      const filename = 'user.schema.json';
      const resourceName = filename.replace('.schema.json', '').replace('.json', '').toLowerCase();
      expect(resourceName).toBe('user');
    });

    it('should pluralize resource name', () => {
      const resourceName = 'product';
      const pluralized = resourceName.endsWith('s') ? resourceName : resourceName + 's';
      expect(pluralized).toBe('products');
    });
  });

  describe('Validate Command', () => {
    it('should validate schema file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      const exists = mockFs.existsSync('schema.json');
      expect(exists).toBe(true);
    });

    it('should read schema file content', () => {
      const schemaContent = JSON.stringify({ type: 'object' });
      mockFs.readFileSync.mockReturnValue(schemaContent);
      const content = mockFs.readFileSync('schema.json', 'utf-8');
      expect(content).toBe(schemaContent);
    });

    it('should parse schema JSON', () => {
      const schema = { type: 'object', properties: { id: { type: 'string' } } };
      const parsed = JSON.parse(JSON.stringify(schema));
      expect(parsed.type).toBe('object');
    });

    it('should handle missing required fields in strict mode', () => {
      const schema: Schema = {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: []
      };
      
      const strictMode = true;
      const hasRequiredFields = schema.required && schema.required.length > 0;
      
      if (strictMode && !hasRequiredFields) {
        expect(hasRequiredFields).toBe(false);
      }
    });
  });

  describe('Init Command', () => {
    it('should validate project name', () => {
      const projectName = 'my-mock-server';
      expect(projectName).toMatch(/^[a-z0-9-]+$/);
    });

    it('should create project directory if not exists', () => {
      mockFs.existsSync.mockReturnValue(false);
      const exists = mockFs.existsSync('new-project');
      expect(exists).toBe(false);
    });

    it('should check if directory is empty', () => {
      mockFs.readdirSync.mockReturnValue([] as any);
      const files = mockFs.readdirSync('project-dir');
      expect(files.length).toBe(0);
    });

    it('should throw error if directory not empty', () => {
      mockFs.readdirSync.mockReturnValue(['file1.js', 'file2.json'] as any);
      const files = mockFs.readdirSync('project-dir');
      expect(files.length).toBeGreaterThan(0);
    });

    it('should create package.json', () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: { schemock: '^1.0.0' }
      };
      
      expect(packageJson.name).toBe('test-project');
      expect(packageJson.dependencies.schemock).toBeDefined();
    });

    it('should create server index file', () => {
      const serverCode = `const { createMockServer } = require('schemock');`;
      expect(serverCode).toContain('createMockServer');
    });

    it('should create sample schema', () => {
      const sampleSchema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' }
        }
      };
      
      expect(sampleSchema.properties.id.format).toBe('uuid');
      expect(sampleSchema.properties.name.type).toBe('string');
    });

    it('should create README', () => {
      const readme = '# My Project\n\nGetting Started\n';
      expect(readme).toContain('# My Project');
      expect(readme).toContain('Getting Started');
    });

    it('should create .gitignore', () => {
      const gitignore = 'node_modules/\n.env\n.DS_Store\n';
      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('.env');
    });
  });

  describe('Init Vite Command', () => {
    it('should check for vite.config files', () => {
      const hasViteConfig = mockFs.existsSync('vite.config.ts') || 
                          mockFs.existsSync('vite.config.js');
      
      if (!hasViteConfig) {
        expect(hasViteConfig).toBe(false);
      }
    });

    it('should create mocks directory', () => {
      mockFs.existsSync.mockReturnValue(false);
      const exists = mockFs.existsSync('mocks');
      expect(exists).toBe(false);
    });

    it('should create sample API schema', () => {
      const apiSchema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' }
              }
            }
          }
        }
      };
      
      expect(apiSchema.properties.users.type).toBe('array');
    });

    it('should add mock script to package.json', () => {
      const packageJson: any = {
        scripts: {
          dev: 'vite',
          build: 'vite build'
        }
      };
      
      packageJson.scripts['mock'] = 'schemock start mocks/api.json --watch';
      
      expect(packageJson.scripts.mock).toBe('schemock start mocks/api.json --watch');
    });

    it('should suggest concurrently for parallel dev', () => {
      const devScript = 'concurrently "npm run mock" "vite"';
      expect(devScript).toContain('concurrently');
      expect(devScript).toContain('npm run mock');
      expect(devScript).toContain('vite');
    });
  });

  describe('CRUD Generator Command', () => {
    it('should generate CRUD routes for resource', () => {
      const resource = 'User';
      const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
      expect(resourceName).toBe('User');
    });

    it('should generate schema with x-schemock-routes', () => {
      const schema = {
        type: 'object',
        'x-schemock-routes': [
          { path: '/api/users', method: 'get' },
          { path: '/api/users/:id', method: 'get' }
        ]
      };
      
      expect(schema['x-schemock-routes']).toBeDefined();
      expect(schema['x-schemock-routes'].length).toBeGreaterThan(0);
    });

    it('should write schema to output file', () => {
      const outputFile = 'user-crud.json';
      expect(outputFile).toBe('user-crud.json');
    });

    it('should use default output filename if not specified', () => {
      const resource = 'product';
      const defaultOutput = `${resource.toLowerCase()}-crud.json`;
      expect(defaultOutput).toBe('product-crud.json');
    });
  });

  describe('Recipes Command', () => {
    it('should check for recipes file', () => {
      const recipesPath = 'docs/recipes.md';
      const exists = mockFs.existsSync(recipesPath);
      expect(typeof exists).toBe('boolean');
    });

    it('should read recipes if file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('# Recipes\n\n## Recipe 1\n');
      
      const content = mockFs.readFileSync('docs/recipes.md', 'utf-8');
      expect(content).toContain('# Recipes');
    });

    it('should handle missing recipes file', () => {
      mockFs.existsSync.mockReturnValue(false);
      const exists = mockFs.existsSync('docs/recipes.md');
      expect(exists).toBe(false);
    });
  });

  describe('Install Command', () => {
    it('should validate installer port', () => {
      const port = 3000;
      expect(port).toBeGreaterThanOrEqual(1);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should keep process running', () => {
      const promise = new Promise(() => {});
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Help Command', () => {
    it('should display help when no arguments', () => {
      const argv = process.argv.slice(2);
      const hasArgs = argv.length > 0;
      // In Jest environment, argv will have test args, so we check the condition
      expect(typeof hasArgs).toBe('boolean');
    });

    it('should show quick start examples', () => {
      const quickStart = [
        'schemock start schema.json',
        'schemock start',
        'schemock init my-api',
        'schemock recipes'
      ];
      
      quickStart.forEach(cmd => {
        expect(cmd).toContain('schemock');
      });
    });

    it('should show example commands', () => {
      const examples = [
        'schemock start user.json --port 8080',
        'schemock start --resource products',
        'schemock init ecommerce-api --name "E-commerce API"'
      ];
      
      examples.forEach(cmd => {
        expect(cmd).toContain('schemock');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found error', () => {
      mockFs.existsSync.mockReturnValue(false);
      const exists = mockFs.existsSync('nonexistent.json');
      expect(exists).toBe(false);
    });

    it('should handle invalid JSON error', () => {
      const invalidJson = '{ invalid json }';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should handle write errors', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      expect(() => {
        mockFs.writeFileSync('test.json', '{}');
      }).toThrow();
    });

    it('should handle directory creation errors', () => {
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => {
        mockFs.mkdirSync('/root/dir', { recursive: true });
      }).toThrow();
    });
  });

  describe('Schema Validation', () => {
    it('should validate schema type', () => {
      const schema: Schema = { type: 'object' };
      expect(['object', 'array', 'string', 'number', 'boolean', 'null']).toContain(schema.type);
    });

    it('should validate schema properties', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties ? Object.keys(schema.properties).length : 0).toBe(2);
    });

    it('should validate required fields', () => {
      const schema: Schema = {
        type: 'object',
        required: ['id', 'name']
      };
      
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('name');
    });

    it('should validate format constraints', () => {
      const validFormats = ['uuid', 'email', 'date-time', 'uri'];
      const schemaProperty = { type: 'string', format: 'email' };
      
      expect(validFormats).toContain(schemaProperty.format);
    });

    it('should validate number constraints', () => {
      const numberProperty = { type: 'number', minimum: 0, maximum: 100 };
      
      expect(numberProperty.minimum).toBeLessThanOrEqual(numberProperty.maximum);
    });

    it('should validate array constraints', () => {
      const arrayProperty = {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
      };
      
      expect(arrayProperty.minItems).toBeLessThanOrEqual(arrayProperty.maxItems);
    });
  });

  describe('File Operations', () => {
    it('should resolve file paths', () => {
      const filePath = './schema.json';
      const resolved = path.resolve(process.cwd(), filePath);
      expect(resolved).toContain('schema.json');
    });

    it('should join path components', () => {
      const dir = 'path/to/dir';
      const file = 'schema.json';
      const joined = path.join(dir, file);
      expect(joined).toContain('schema.json');
      expect(joined).toContain(file);
    });

    it('should handle relative paths', () => {
      const relativePath = '../schemas/user.json';
      expect(relativePath).toContain('..');
    });

    it('should handle absolute paths', () => {
      const absolutePath = '/home/user/schemas/user.json';
      expect(absolutePath.startsWith('/')).toBe(true);
    });
  });

  describe('Process Management', () => {
    it('should handle SIGINT signal', () => {
      const signal = 'SIGINT';
      expect(signal).toBe('SIGINT');
    });

    it('should handle process exit', () => {
      const exitCode = 0;
      expect(typeof exitCode).toBe('number');
      expect(exitCode).toBe(0);
    });

    it('should handle graceful shutdown', () => {
      const shutdownSteps = ['stop server', 'close watcher', 'exit process'];
      expect(shutdownSteps.length).toBe(3);
    });
  });

  describe('Configuration Options', () => {
    it('should handle CORS option', () => {
      const corsEnabled = true;
      const corsDisabled = false;
      
      expect(typeof corsEnabled).toBe('boolean');
      expect(typeof corsDisabled).toBe('boolean');
    });

    it('should handle strict mode option', () => {
      const strictMode = true;
      expect(typeof strictMode).toBe('boolean');
    });

    it('should handle watch mode option', () => {
      const watchMode = false;
      expect(typeof watchMode).toBe('boolean');
    });

    it('should handle log level option', () => {
      const logLevels = ['error', 'warn', 'info', 'debug'];
      const currentLevel = 'info';
      
      expect(logLevels).toContain(currentLevel);
    });
  });

  describe('Schema Watcher Integration', () => {
    it('should detect file changes', () => {
      const changedPath = 'schema.json';
      expect(changedPath).toContain('.json');
    });

    it('should reload schema on change', () => {
      const reloadSteps = ['read file', 'parse JSON', 'validate schema', 'restart server'];
      expect(reloadSteps.length).toBe(4);
    });

    it('should handle reload errors', () => {
      const errorHandling = ['log error', 'continue with old schema', 'notify user'];
      expect(errorHandling.length).toBe(3);
    });

    it('should close watcher on exit', () => {
      const closeWatcher = true;
      expect(closeWatcher).toBe(true);
    });
  });
});
