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
    .action((schemaPath, options) => {
    try {
        let schema = {
            type: 'object',
            properties: {
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' }
            }
        };
        // Load schema from file if provided
        if (schemaPath) {
            const absolutePath = (0, path_1.resolve)(process.cwd(), schemaPath);
            if (!(0, fs_1.existsSync)(absolutePath)) {
                console.error(chalk_1.default.red(`❌ Schema file not found: ${absolutePath}`));
                process.exit(1);
            }
            try {
                schema = JSON.parse((0, fs_1.readFileSync)(absolutePath, 'utf-8'));
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                console.error(chalk_1.default.red('❌ Error parsing schema file:'), errorMessage);
                process.exit(1);
            }
        }
        else {
            console.log(chalk_1.default.yellow('ℹ️  No schema provided, using default schema'));
        }
        const port = parseInt(options.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error(chalk_1.default.red('❌ Invalid port number. Please provide a number between 1 and 65535'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🚀 Starting mock server on port ${port}...`));
        console.log(chalk_1.default.blue(`🔌 CORS: ${options.cors ? 'enabled' : 'disabled'}`));
        console.log(chalk_1.default.blue(`📝 Log level: ${options.logLevel}`));
        if (schemaPath) {
            console.log(chalk_1.default.blue(`📄 Using schema: ${(0, path_1.resolve)(process.cwd(), schemaPath)}`));
        }
        const server = (0, __1.createMockServer)(schema, {
            port,
            cors: options.cors,
            logLevel: options.logLevel
        });
        console.log(chalk_1.default.green(`✅ Server running at http://localhost:${port}`));
        console.log(chalk_1.default.blue('🛑 Press Ctrl+C to stop the server'));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error starting mock server:'), errorMessage);
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
        const projectDir = (0, path_1.resolve)(process.cwd(), directory);
        // Create project directory if it doesn't exist
        if (!(0, fs_1.existsSync)(projectDir)) {
            (0, fs_1.mkdirSync)(projectDir, { recursive: true });
        }
        // Create package.json
        const packageJson = {
            name: options.name,
            version: '1.0.0',
            description: 'A mock server generated with Schemock',
            main: 'index.js',
            scripts: {
                start: 'node index.js',
                dev: 'nodemon index.js',
                test: 'echo \"Error: no test specified\" && exit 1'
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
const port = ${options.port};

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

// Start server
app.listen(port, () => {
  console.log(\`🚀 Server running at http://localhost:\${port}\`);
  console.log('📝 Example API available at /api/example');
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
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, '.gitignore'), 'node_modules/\n.env\n.DS_Store\n');
        console.log(chalk_1.default.green(`✅ Project initialized in ${projectDir}`));
        console.log(chalk_1.default.blue('👉 Next steps:'));
        console.log(chalk_1.default.blue(`  cd ${directory}`));
        console.log(chalk_1.default.blue('  npm install'));
        console.log(chalk_1.default.blue('  npm start'));
        console.log(chalk_1.default.blue('\nEdit index.js to customize your mock server'));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error initializing project:'), errorMessage);
        process.exit(1);
    }
});
// Show help if no arguments
if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}
program.parse(process.argv);
