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
  .action(async (schemaPath, options) => {
    try {
      let schema: Schema = {
        type: 'object',
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      };

      // Validate and load schema from file if provided
      if (schemaPath) {
        try {
          const absolutePath = validateFilePath(schemaPath);
          validateFileExists(absolutePath);
          
          const fileContent = readFileSync(absolutePath, 'utf-8');
          schema = JSON.parse(fileContent);
          validateSchema(schema);
          
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
        console.log(chalk.yellow('ℹ️  No schema provided, using default schema'));
      }

      // Validate options
      const port = validatePort(options.port);
      const logLevel = validateLogLevel(options.logLevel);
      const watchMode = options.watch || false;

      console.log(chalk.blue(`🚀 Starting mock server on port ${port}...`));
      console.log(chalk.blue(`🔌 CORS: ${options.cors ? 'enabled' : 'disabled'}`));
      console.log(chalk.blue(`📝 Log level: ${logLevel}`));
      
      if (schemaPath) {
        console.log(chalk.blue(`📄 Using schema: ${resolve(process.cwd(), schemaPath)}`));
        if (watchMode) {
          console.log(chalk.blue(`👁️  Watch mode: enabled`));
        }
      }

      const server = createMockServer(schema, {
        port,
        cors: options.cors,
        logLevel
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
            console.log(chalk.yellow(`\n🔄 Reloading schema...`));
            
            // Read and validate new schema
            const newContent = readFileSync(changedPath, 'utf-8');
            const newSchema = JSON.parse(newContent);
            validateSchema(newSchema);
            
            // Create new server config
            const newServerConfig = createMockServer(newSchema, {
              port,
              cors: options.cors,
              logLevel
            }).getConfig();
            
            // Restart server with new configuration
            await server.restart(newServerConfig);
            
            console.log(chalk.green(`✅ Server reloaded successfully`));
            console.log(chalk.blue(`📄 Using updated schema from: ${changedPath}`));
          } catch (error: unknown) {
            const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
            console.error(chalk.red(`❌ Error reloading schema:`));
            console.error(chalk.red(message));
            console.log(chalk.yellow(`⚠️  Server continues running with previous schema`));
          }
        });

        watcher.on('error', (error: Error) => {
          console.error(chalk.red(`❌ Watcher error: ${error.message}`));
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
      console.error(chalk.red('❌ Error starting mock server:'));
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
          dev: 'nodemon index.js',
          test: 'echo "Error: no test specified" && exit 1'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5',
          'body-parser': '^1.20.2'
        },
        devDependencies: {
          nodemon: '^3.0.1'
        }
      };

      // Create a simple server file
      const serverCode = `const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = ${port};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/api/example', (req, res) => {
  res.json({
    message: 'Hello from your mock server!',
    timestamp: new Date().toISOString(),
    data: {
      // Add your mock data here
      id: '123',
      name: 'Example Item'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(\`🚀 Server running at http://localhost:\${port}\`);
  console.log('📝 Example API available at /api/example');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(\`❌ Port \${port} is already in use. Please use a different port.\`);
  } else {
    console.error('❌ Server error:', err.message);
  }
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

      // Write files
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      writeFileSync(join(projectDir, 'index.js'), serverCode);
      writeFileSync(
        join(projectDir, 'example-schema.json'),
        JSON.stringify(sampleSchema, null, 2)
      );
      writeFileSync(
        join(projectDir, '.gitignore'),
        'node_modules/\n.env\n.DS_Store\n*.log\n'
      );

      console.log(chalk.green(`✅ Project initialized in ${projectDir}`));
      console.log(chalk.blue('👉 Next steps:'));
      console.log(chalk.blue(`  cd ${directory !== '.' ? directory : 'your-project'}`));
      console.log(chalk.blue('  npm install'));
      console.log(chalk.blue('  npm start'));
      console.log(chalk.blue('\nEdit index.js to customize your mock server'));

    } catch (error: unknown) {
      const message = error instanceof Error ? formatError(error) : 'Unknown error occurred';
      console.error(chalk.red('❌ Error initializing project:'));
      console.error(chalk.red(message));
      process.exit(1);
    }
  });

// Install command
program
  .command('install')
  .description('Launch the interactive installer')
  .option('-p, --port <number>', 'Port to run the installer UI on', '3000')
  .action((options) => {
    try {
      const port = validatePort(options.port);
      console.log(chalk.blue(`🚀 Launching installer UI...`));
      startInstallerServer(port);
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

${chalk.yellow('Examples:')}
  ${chalk.cyan('schemock start user.json --port 8080')}
  ${chalk.cyan('schemock start api.json --log-level debug')}
  ${chalk.cyan('schemock init ecommerce-api --name "E-commerce API"')}

${chalk.yellow('For detailed help:')}
  ${chalk.cyan('schemock start --help')}
  ${chalk.cyan('schemock init --help')}
`);
  process.exit(0);
}

program.parse(process.argv);
