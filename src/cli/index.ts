#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import { createMockServer } from '..';
import { Schema } from '../types';
import { formatError, FileError, ValidationError, ConfigurationError } from '../errors';
import {
  validatePort,
  validateFilePath,
  validateFileExists,
  validateSchema,
  validateLogLevel,
  validateProjectName
} from '../utils/validation';
import { SchemaWatcher } from '../utils/watcher';
import { startInstallerServer } from '../installer/server';
import { log, setLogLevel } from '../utils/logger';
import { generateCRUDDSL } from '../generators/routes';

const program = new Command();

program
  .name('schemock')
  .description('A lightweight mock server generator from JSON schemas')
  .version('1.0.0');

// Start server command
program
  .command('start [schemaPath]')
  .description('Start a mock server with the provided schema')
  .option('-p, --port <number>', 'Port to run the server on', '3000')
  .option('--no-cors', 'Disable CORS')
  .option('--log-level <level>', 'Log level (error, warn, info, debug)', 'info')
  .option('-w, --watch', 'Watch schema file for changes and auto-reload')
  .option('--scenario <preset>', 'Preset scenario (happy-path, slow, error-heavy, sad-path)', 'happy-path')
  .option('--strict', 'Enforce strict schema validation', false)
  .option('--resource <name>', 'Resource name for default schema (when no schema file is provided)')
  .action(async (schemaPath, options) => {
    try {
      // Set log level first
      const logLevel = validateLogLevel(options.logLevel);
      setLogLevel(logLevel);
      
      const scenario = options.scenario;
      if (scenario && !['happy-path', 'slow', 'error-heavy', 'sad-path'].includes(scenario)) {
        console.error(chalk.red(`❌ Invalid scenario: ${scenario}. Use happy-path, slow, error-heavy, or sad-path.`));
        process.exit(1);
      }

      const strict = options.strict || false;
      const resourceOption = options.resource;

      let schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'name']
      };

      if (resourceOption) {
        schema.title = resourceOption;
      }

      // Validate and load schema from file if provided
      if (schemaPath) {
        try {
          const absolutePath = validateFilePath(schemaPath);
          validateFileExists(absolutePath);
          
          const fileContent = readFileSync(absolutePath, 'utf-8');
          schema = JSON.parse(fileContent);
          validateSchema(schema, strict);
          
          log.info('Schema loaded successfully', {
            module: 'cli',
            schemaPath: absolutePath
          });
        } catch (error: unknown) {
          if (error instanceof SyntaxError) {
            throw new FileError(
              `Invalid JSON in schema file: ${error.message}`,
              schemaPath,
              'parse'
            );
          }
          throw error;
        }
      } else {
        log.info('Using default schema', { module: 'cli' });
      }

      // Validate options
      const port = validatePort(options.port);
      const watchMode = options.watch || false;
      
      // Derive resource name from filename if not provided
      let resourceName = undefined;
      if (schemaPath) {
        const filename = schemaPath.split(/[/\\]/).pop() || '';
        resourceName = filename.replace('.schema.json', '').replace('.json', '').toLowerCase();
        // Simple pluralization
        if (!resourceName.endsWith('s')) {
          resourceName += 's';
        }
      }

      log.info('Starting mock server', {
        module: 'cli',
        port,
        cors: options.cors,
        logLevel,
        watchMode,
        resourceName
      });

      const server = createMockServer(schema, {
        port,
        cors: options.cors,
        logLevel,
        scenario,
        strict,
        resourceName
      });

      await server.start();

      console.log(chalk.green(`✅ Server running at http://localhost:${port}`));
      console.log(chalk.blue('🛑 Press Ctrl+C to stop the server'));

      // Setup watch mode if enabled and schema path provided
      if (watchMode && schemaPath) {
        const watcher = new SchemaWatcher();
        const absolutePath = validateFilePath(schemaPath);
        
        watcher.on('change', async (changedPath: string) => {
          try {
            log.info('Reloading schema', {
              module: 'cli',
              schemaPath: changedPath
            });
            
            // Read and validate new schema
            const newContent = readFileSync(changedPath, 'utf-8');
            const newSchema = JSON.parse(newContent);
            validateSchema(newSchema);
            
            // Create new server config
            const newServerConfig = createMockServer(newSchema, {
              port,
              cors: options.cors,
              logLevel,
              scenario
            }).getConfig();
            
            // Restart server with new configuration
            await server.restart(newServerConfig);
            
            console.log(chalk.green(`✅ Server reloaded successfully`));
          } catch (error: unknown) {
            const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
            log.error('Error reloading schema', {
              module: 'cli',
              error: error instanceof Error ? error : new Error(String(error))
            });
            console.error(chalk.red(`❌ Error reloading schema:`));
            console.error(chalk.red(message));
            console.log(chalk.yellow(`⚠️  Server continues running with previous schema`));
          }
        });

        watcher.on('error', (error: Error) => {
          log.error('Watcher error', {
            module: 'cli',
            error
          });
        });

        await watcher.watch(absolutePath);

        // Cleanup on exit
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n\n🛑 Shutting down...'));
          await watcher.close();
          await server.stop();
          console.log(chalk.green('✅ Server stopped'));
          process.exit(0);
        });
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      log.error('Error starting mock server', {
        module: 'cli',
        error: error instanceof Error ? error : new Error(String(error))
      });
      console.error(chalk.red('❌ Error starting mock server:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <schemaPath>')
  .description('Validate a JSON schema and show human-readable hints')
  .option('--strict', 'Enforce strict schema validation', false)
  .action(async (schemaPath, options) => {
    try {
      const absolutePath = validateFilePath(schemaPath);
      validateFileExists(absolutePath);
      
      const fileContent = readFileSync(absolutePath, 'utf-8');
      const schema = JSON.parse(fileContent);
      const strict = options.strict || false;
      
      console.log(chalk.blue(`🔍 Validating schema: ${absolutePath}...`));
      
      try {
        validateSchema(schema, strict);
        // If it passes basic validation, do more thorough checks if strict
        if (strict) {
          // Additional strict checks could go here
          if (!schema.required || schema.required.length === 0) {
            console.log(chalk.yellow('⚠️  Strict mode warning: Schema has no required properties.'));
          }
        }
        console.log(chalk.green('✅ Schema is valid!'));
      } catch (error: any) {
        if (error instanceof ValidationError) {
          console.error(chalk.red('❌ Schema validation failed:'));
          console.error(chalk.red(`   Message: ${error.message}`));
          if (error.details && error.details.field) {
            console.error(chalk.red(`   Field: ${error.details.field}`));
          }
          
          // Try to find line number in fileContent
          if (error.details && error.details.field) {
            const field = error.details.field.split('.').pop();
            const lines = fileContent.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(`"${field}"`)) {
                console.error(chalk.yellow(`   Hint: Error likely near line ${i + 1}`));
                break;
              }
            }
          }
        } else {
          throw error;
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error validating schema:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Generate project command
program
  .command('init [directory]')
  .description('Initialize a new mock server project')
  .option('--name <name>', 'Project name', 'my-mock-server')
  .option('--port <port>', 'Default port', '3000')
  .action((directory = '.', options) => {
    try {
      // Validate project name
      const projectName = validateProjectName(options.name);
      const port = validatePort(options.port);
      
      const projectDir = resolve(process.cwd(), directory);
      
      // Create project directory if it doesn't exist
      if (!existsSync(projectDir)) {
        mkdirSync(projectDir, { recursive: true });
      }

      // Check if directory is empty (except for hidden files)
      const files = require('fs').readdirSync(projectDir).filter((f: string) => !f.startsWith('.'));
      if (files.length > 0) {
        throw new ConfigurationError(
          `Directory is not empty: ${projectDir}. Please use an empty directory or specify a new one.`,
          { directory: projectDir, existingFiles: files.length }
        );
      }

      // Create package.json
      const packageJson = {
        name: projectName,
        version: '1.0.0',
        description: 'A mock server generated with Schemock',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'schemock start schema.json --watch',
          test: 'echo "Error: no test specified" && exit 1'
        },
        dependencies: {
          schemock: '^1.0.0'
        }
      };

      // Create a simple server file
      const serverCode = `const { createMockServer } = require('schemock');
const schema = require('./schema.json');

const port = ${port};

const server = createMockServer(schema, { 
  port,
  logLevel: 'info',
  cors: true
});

console.log('🚀 Starting Schemock server...');

server.start().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
`;

      // Create a sample schema file
      const sampleSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Example Schema',
        description: 'A sample JSON schema for your mock server',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 0, maximum: 120 },
          isActive: { type: 'boolean', default: true },
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

      // Create a README for the new project
      const projectReadme = `# ${projectName}

This is a mock server project generated with [Schemock](https://github.com/toxzak-svg/schemock-app).

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Start the server**:
   \`\`\`bash
   npm start
   \`\`\`

3. **Development mode (with auto-reload)**:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

- \`schema.json\`: Your JSON schema that defines the API.
- \`index.js\`: The entry point that starts the Schemock server.
- \`package.json\`: Project metadata and scripts.

## Interactive Playground

Once the server is running, visit [http://localhost:${port}](http://localhost:${port}) to explore your API in the interactive playground.
`;

      // Write files
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      writeFileSync(join(projectDir, 'index.js'), serverCode);
      writeFileSync(
        join(projectDir, 'schema.json'),
        JSON.stringify(sampleSchema, null, 2)
      );
      writeFileSync(
        join(projectDir, 'README.md'),
        projectReadme
      );
      writeFileSync(
        join(projectDir, '.gitignore'),
        'node_modules/\n.env\n.DS_Store\n*.log\n'
      );

      console.log(chalk.green(`\n✨ Project ${chalk.bold(projectName)} initialized successfully in ${chalk.bold(projectDir)}!`));
      console.log(chalk.blue('\nNext steps:'));
      console.log(`  1. ${chalk.cyan(`cd ${directory !== '.' ? directory : 'your-project'}`)}`);
      console.log(`  2. ${chalk.cyan('npm install')}`);
      console.log(`  3. ${chalk.cyan('npm start')}`);
      console.log(chalk.yellow('\nHappy mocking! 🚀'));

    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error initializing project:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Integrate with Vite command
program
  .command('init-vite')
  .description('Integrate Schemock into an existing Vite project')
  .option('--prefix <prefix>', 'API prefix to proxy', '/api')
  .option('--port <port>', 'Mock server port', '3001')
  .action((options) => {
    try {
      const projectDir = process.cwd();
      const prefix = options.prefix || '/api';
      const port = validatePort(options.port || '3001');

      // Check if it's a Vite project
      const hasVite = existsSync(join(projectDir, 'vite.config.ts')) || 
                      existsSync(join(projectDir, 'vite.config.js'));
      
      if (!hasVite) {
        console.warn(chalk.yellow('⚠️ No vite.config.ts or vite.config.js found in the current directory.'));
        console.warn(chalk.yellow('Continuing anyway, but you might need to configure Vite manually.'));
      }

      // Create mocks directory
      const mocksDir = join(projectDir, 'mocks');
      if (!existsSync(mocksDir)) {
        mkdirSync(mocksDir);
      }

      // Create sample schema
      const sampleSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Mock API',
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              },
              required: ['id', 'name']
            }
          }
        }
      };

      writeFileSync(
        join(mocksDir, 'api.json'),
        JSON.stringify(sampleSchema, null, 2)
      );

      // Add mock script to package.json
      const packageJsonPath = join(projectDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts['mock'] = 'schemock start mocks/api.json --watch';
        
        // Suggest updating dev script
        if (packageJson.scripts['dev'] && !packageJson.scripts['dev'].includes('mock')) {
           console.log(chalk.blue('\n💡 Suggestion: Update your "dev" script in package.json to run the mock server alongside Vite:'));
           console.log(chalk.cyan(`   "dev": "concurrently \\"npm run mock\\" \\"vite\\""`));
           console.log(chalk.gray('   (requires `concurrently` package)'));
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }

      console.log(chalk.green('\n✅ Schemock Vite integration initialized!'));
      console.log(chalk.blue('\n👉 Next steps:'));
      console.log(chalk.blue('1. Install Schemock:'));
      console.log(chalk.cyan('   npm install --save-dev schemock'));
      console.log(chalk.blue('2. Add the plugin to your vite.config.ts:'));
      console.log(chalk.gray(`
import { defineConfig } from 'vite';
import { schemockVitePlugin } from 'schemock';

export default defineConfig({
  plugins: [
    schemockVitePlugin({
      schemaPath: 'mocks/api.json',
      prefix: '${prefix}',
      port: ${port}
    })
  ]
});
      `));
      console.log(chalk.blue('3. Start your dev server:'));
      console.log(chalk.cyan('   npm run dev'));

    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error initializing Vite integration:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// CRUD generator command
program
  .command('crud <resource>')
  .description('Generate a CRUD schema for a resource')
  .option('-o, --output <file>', 'Output file name')
  .action((resource, options) => {
    try {
      const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
      const routes = generateCRUDDSL(resourceName);
      
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: `${resourceName} API`,
        type: 'object',
        'x-schemock-routes': routes,
        definitions: {
          [resourceName]: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              createdAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name']
          }
        }
      };
      
      const outputFile = options.output || `${resource.toLowerCase()}-crud.json`;
      writeFileSync(outputFile, JSON.stringify(schema, null, 2));
      
      console.log(chalk.green(`✅ CRUD schema for ${resourceName} generated in ${outputFile}`));
      console.log(chalk.blue(`👉 Start with: schemock start ${outputFile}`));
    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error generating CRUD schema:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Recipes command
program
  .command('recipes')
  .description('Show common integration recipes and guides')
  .action(() => {
    try {
      const recipesPath = resolve(__dirname, '../../docs/recipes.md');
      if (existsSync(recipesPath)) {
        const content = readFileSync(recipesPath, 'utf-8');
        console.log(chalk.bold.blue('\n--- Schemock Recipes ---\n'));
        console.log(content);
        console.log(chalk.bold.blue('\n--- End of Recipes ---\n'));
      } else {
        console.log(chalk.yellow('\n⚠️  Recipes documentation not found locally.'));
        console.log(chalk.blue('🌐 Visit: https://github.com/toxzak-svg/schemock-app/blob/main/docs/recipes.md\n'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error reading recipes:'), error);
    }
  });

// Install command
program
  .command('install')
  .description('Launch the interactive installer')
  .option('-p, --port <number>', 'Port to run the installer UI on', '3000')
  .action(async (options) => {
    try {
      const port = validatePort(options.port);
      console.log(chalk.blue(`🚀 Launching installer UI...`));
      const server = startInstallerServer(port);
      
      // Keep the process running
      await new Promise(() => {}); // Never resolves, keeps process alive
    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error launching installer:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Show help if no arguments
if (!process.argv.slice(2).length) {
  console.log(`
${chalk.blue('Schemock - Mock Server Generator')}
${chalk.gray('A lightweight mock server generator from JSON schemas')}

${chalk.yellow('Quick Start:')}
  ${chalk.cyan('schemock start schema.json')}     Start with custom schema
  ${chalk.cyan('schemock start')}                 Start with default schema
  ${chalk.cyan('schemock init my-api')}         Initialize new project
  ${chalk.cyan('schemock recipes')}              Show integration guides

${chalk.yellow('Examples:')}
  ${chalk.cyan('schemock start user.json --port 8080')}
  ${chalk.cyan('schemock start --resource products')}
  ${chalk.cyan('schemock init ecommerce-api --name "E-commerce API"')}

${chalk.yellow('For detailed help:')}
  ${chalk.cyan('schemock start --help')}
  ${chalk.cyan('schemock init --help')}
`);
  process.exit(0);
}

program.parse(process.argv);
