#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const __1 = require("..");
const errors_1 = require("../errors");
const validation_1 = require("../utils/validation");
const watcher_1 = require("../utils/watcher");
const program = new commander_1.Command();
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
        let schema = {
            type: 'object',
            properties: {
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' }
            }
        };
        // Validate and load schema from file if provided
        if (schemaPath) {
            try {
                const absolutePath = (0, validation_1.validateFilePath)(schemaPath);
                (0, validation_1.validateFileExists)(absolutePath);
                const fileContent = (0, fs_1.readFileSync)(absolutePath, 'utf-8');
                schema = JSON.parse(fileContent);
                (0, validation_1.validateSchema)(schema);
            }
            catch (error) {
                if (error instanceof SyntaxError) {
                    throw new errors_1.FileError(`Invalid JSON in schema file: ${error.message}`, schemaPath, 'parse');
                }
                throw error;
            }
        }
        else {
            console.log(chalk_1.default.yellow('ℹ️  No schema provided, using default schema'));
        }
        // Validate options
        const port = (0, validation_1.validatePort)(options.port);
        const logLevel = (0, validation_1.validateLogLevel)(options.logLevel);
        const watchMode = options.watch || false;
        console.log(chalk_1.default.blue(`🚀 Starting mock server on port ${port}...`));
        console.log(chalk_1.default.blue(`🔌 CORS: ${options.cors ? 'enabled' : 'disabled'}`));
        console.log(chalk_1.default.blue(`📝 Log level: ${logLevel}`));
        if (schemaPath) {
            console.log(chalk_1.default.blue(`📄 Using schema: ${(0, path_1.resolve)(process.cwd(), schemaPath)}`));
            if (watchMode) {
                console.log(chalk_1.default.blue(`👁️  Watch mode: enabled`));
            }
        }
        const server = (0, __1.createMockServer)(schema, {
            port,
            cors: options.cors,
            logLevel
        });
        await server.start();
        console.log(chalk_1.default.green(`✅ Server running at http://localhost:${port}`));
        console.log(chalk_1.default.blue('🛑 Press Ctrl+C to stop the server'));
        // Setup watch mode if enabled and schema path provided
        if (watchMode && schemaPath) {
            const watcher = new watcher_1.SchemaWatcher();
            const absolutePath = (0, validation_1.validateFilePath)(schemaPath);
            watcher.on('change', async (changedPath) => {
                try {
                    console.log(chalk_1.default.yellow(`\n🔄 Reloading schema...`));
                    // Read and validate new schema
                    const newContent = (0, fs_1.readFileSync)(changedPath, 'utf-8');
                    const newSchema = JSON.parse(newContent);
                    (0, validation_1.validateSchema)(newSchema);
                    // Create new server config
                    const newServerConfig = (0, __1.createMockServer)(newSchema, {
                        port,
                        cors: options.cors,
                        logLevel
                    }).getConfig();
                    // Restart server with new configuration
                    await server.restart(newServerConfig);
                    console.log(chalk_1.default.green(`✅ Server reloaded successfully`));
                    console.log(chalk_1.default.blue(`📄 Using updated schema from: ${changedPath}`));
                }
                catch (error) {
                    const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
                    console.error(chalk_1.default.red(`❌ Error reloading schema:`));
                    console.error(chalk_1.default.red(message));
                    console.log(chalk_1.default.yellow(`⚠️  Server continues running with previous schema`));
                }
            });
            watcher.on('error', (error) => {
                console.error(chalk_1.default.red(`❌ Watcher error: ${error.message}`));
            });
            watcher.watch(absolutePath);
            // Cleanup on exit
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.yellow('\n\n🛑 Shutting down...'));
                await watcher.close();
                await server.stop();
                console.log(chalk_1.default.green('✅ Server stopped'));
                process.exit(0);
            });
        }
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error starting mock server:'));
        console.error(chalk_1.default.red(message));
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
        const projectName = (0, validation_1.validateProjectName)(options.name);
        const port = (0, validation_1.validatePort)(options.port);
        const projectDir = (0, path_1.resolve)(process.cwd(), directory);
        // Create project directory if it doesn't exist
        if (!(0, fs_1.existsSync)(projectDir)) {
            (0, fs_1.mkdirSync)(projectDir, { recursive: true });
        }
        // Check if directory is empty (except for hidden files)
        const files = require('fs').readdirSync(projectDir).filter((f) => !f.startsWith('.'));
        if (files.length > 0) {
            throw new errors_1.ConfigurationError(`Directory is not empty: ${projectDir}. Please use an empty directory or specify a new one.`, { directory: projectDir, existingFiles: files.length });
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
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'index.js'), serverCode);
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'example-schema.json'), JSON.stringify(sampleSchema, null, 2));
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, '.gitignore'), 'node_modules/\n.env\n.DS_Store\n*.log\n');
        console.log(chalk_1.default.green(`✅ Project initialized in ${projectDir}`));
        console.log(chalk_1.default.blue('👉 Next steps:'));
        console.log(chalk_1.default.blue(`  cd ${directory !== '.' ? directory : 'your-project'}`));
        console.log(chalk_1.default.blue('  npm install'));
        console.log(chalk_1.default.blue('  npm start'));
        console.log(chalk_1.default.blue('\nEdit index.js to customize your mock server'));
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error initializing project:'));
        console.error(chalk_1.default.red(message));
        process.exit(1);
    }
});
// Show help if no arguments
if (!process.argv.slice(2).length) {
    console.log(`
${chalk_1.default.blue('Schemock - Mock Server Generator')}
${chalk_1.default.gray('A lightweight mock server generator from JSON schemas')}

${chalk_1.default.yellow('Quick Start:')}
  ${chalk_1.default.cyan('schemock start schema.json')}     Start with custom schema
  ${chalk_1.default.cyan('schemock start')}                 Start with default schema
  ${chalk_1.default.cyan('schemock init my-api')}         Initialize new project

${chalk_1.default.yellow('Examples:')}
  ${chalk_1.default.cyan('schemock start user.json --port 8080')}
  ${chalk_1.default.cyan('schemock start api.json --log-level debug')}
  ${chalk_1.default.cyan('schemock init ecommerce-api --name "E-commerce API"')}

${chalk_1.default.yellow('For detailed help:')}
  ${chalk_1.default.cyan('schemock start --help')}
  ${chalk_1.default.cyan('schemock init --help')}
`);
    process.exit(0);
}
program.parse(process.argv);
