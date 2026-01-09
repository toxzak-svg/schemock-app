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
const server_1 = require("../installer/server");
const logger_1 = require("../utils/logger");
const routes_1 = require("../generators/routes");
const program = new commander_1.Command();
program
    .name('schemock')
    .description('A lightweight mock server generator from JSON schemas')
    .version('1.0.0');
// Start server command
program
    .command('start [schemaPath]')
    .description('Start a mock server with the provided schema')
    .option('-p, --port <number>', 'Port to run the server on (defaults to PORT env var or 3000)')
    .option('--no-cors', 'Disable CORS')
    .option('--log-level <level>', 'Log level (error, warn, info, debug)', 'info')
    .option('-w, --watch', 'Watch schema file for changes and auto-reload')
    .option('--scenario <preset>', 'Preset scenario (happy-path, slow, error-heavy, sad-path)', 'happy-path')
    .option('--strict', 'Enforce strict schema validation', false)
    .option('--resource <name>', 'Resource name for default schema (when no schema file is provided)')
    .action(async (schemaPath, options) => {
    try {
        // Set log level first
        const logLevel = (0, validation_1.validateLogLevel)(options.logLevel);
        (0, logger_1.setLogLevel)(logLevel);
        const scenario = options.scenario;
        if (scenario && !['happy-path', 'slow', 'error-heavy', 'sad-path'].includes(scenario)) {
            console.error(chalk_1.default.red(`❌ Invalid scenario: ${scenario}. Use happy-path, slow, error-heavy, or sad-path.`));
            process.exit(1);
        }
        const strict = options.strict || false;
        const resourceOption = options.resource;
        let schema = {
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
                const absolutePath = (0, validation_1.validateFilePath)(schemaPath);
                (0, validation_1.validateFileExists)(absolutePath);
                const fileContent = (0, fs_1.readFileSync)(absolutePath, 'utf-8');
                schema = JSON.parse(fileContent);
                (0, validation_1.validateSchema)(schema, strict);
                logger_1.log.info('Schema loaded successfully', {
                    module: 'cli',
                    schemaPath: absolutePath
                });
            }
            catch (error) {
                if (error instanceof SyntaxError) {
                    throw new errors_1.FileError(`Invalid JSON in schema file: ${error.message}`, schemaPath, 'parse');
                }
                throw error;
            }
        }
        else {
            logger_1.log.info('Using default schema', { module: 'cli' });
        }
        // Validate options - support Railway's PORT environment variable
        const portValue = options.port || process.env.PORT || '3000';
        const port = (0, validation_1.validatePort)(portValue);
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
        logger_1.log.info('Starting mock server', {
            module: 'cli',
            port,
            cors: options.cors,
            logLevel,
            watchMode,
            resourceName
        });
        const server = (0, __1.createMockServer)(schema, {
            port,
            cors: options.cors,
            logLevel,
            scenario,
            strict,
            resourceName
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
                    logger_1.log.info('Reloading schema', {
                        module: 'cli',
                        schemaPath: changedPath
                    });
                    // Read and validate new schema
                    const newContent = (0, fs_1.readFileSync)(changedPath, 'utf-8');
                    const newSchema = JSON.parse(newContent);
                    (0, validation_1.validateSchema)(newSchema);
                    // Create new server config
                    const newServerConfig = (0, __1.createMockServer)(newSchema, {
                        port,
                        cors: options.cors,
                        logLevel,
                        scenario
                    }).getConfig();
                    // Restart server with new configuration
                    await server.restart(newServerConfig);
                    console.log(chalk_1.default.green(`✅ Server reloaded successfully`));
                }
                catch (error) {
                    const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
                    logger_1.log.error('Error reloading schema', {
                        module: 'cli',
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                    console.error(chalk_1.default.red(`❌ Error reloading schema:`));
                    console.error(chalk_1.default.red(message));
                    console.log(chalk_1.default.yellow(`⚠️  Server continues running with previous schema`));
                }
            });
            watcher.on('error', (error) => {
                logger_1.log.error('Watcher error', {
                    module: 'cli',
                    error
                });
            });
            await watcher.watch(absolutePath);
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
        logger_1.log.error('Error starting mock server', {
            module: 'cli',
            error: error instanceof Error ? error : new Error(String(error))
        });
        console.error(chalk_1.default.red('❌ Error starting mock server:'));
        console.error(chalk_1.default.red(message));
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
        const absolutePath = (0, validation_1.validateFilePath)(schemaPath);
        (0, validation_1.validateFileExists)(absolutePath);
        const fileContent = (0, fs_1.readFileSync)(absolutePath, 'utf-8');
        const schema = JSON.parse(fileContent);
        const strict = options.strict || false;
        console.log(chalk_1.default.blue(`🔍 Validating schema: ${absolutePath}...`));
        try {
            (0, validation_1.validateSchema)(schema, strict);
            // If it passes basic validation, do more thorough checks if strict
            if (strict) {
                // Additional strict checks could go here
                if (!schema.required || schema.required.length === 0) {
                    console.log(chalk_1.default.yellow('⚠️  Strict mode warning: Schema has no required properties.'));
                }
            }
            console.log(chalk_1.default.green('✅ Schema is valid!'));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                console.error(chalk_1.default.red('❌ Schema validation failed:'));
                console.error(chalk_1.default.red(`   Message: ${error.message}`));
                if (error.details && error.details.field) {
                    console.error(chalk_1.default.red(`   Field: ${error.details.field}`));
                }
                // Try to find line number in fileContent
                if (error.details && error.details.field) {
                    const field = error.details.field.split('.').pop();
                    const lines = fileContent.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(`"${field}"`)) {
                            console.error(chalk_1.default.yellow(`   Hint: Error likely near line ${i + 1}`));
                            break;
                        }
                    }
                }
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error validating schema:'));
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
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'index.js'), serverCode);
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'schema.json'), JSON.stringify(sampleSchema, null, 2));
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, 'README.md'), projectReadme);
        (0, fs_1.writeFileSync)((0, path_1.join)(projectDir, '.gitignore'), 'node_modules/\n.env\n.DS_Store\n*.log\n');
        console.log(chalk_1.default.green(`\n✨ Project ${chalk_1.default.bold(projectName)} initialized successfully in ${chalk_1.default.bold(projectDir)}!`));
        console.log(chalk_1.default.blue('\nNext steps:'));
        console.log(`  1. ${chalk_1.default.cyan(`cd ${directory !== '.' ? directory : 'your-project'}`)}`);
        console.log(`  2. ${chalk_1.default.cyan('npm install')}`);
        console.log(`  3. ${chalk_1.default.cyan('npm start')}`);
        console.log(chalk_1.default.yellow('\nHappy mocking! 🚀'));
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error initializing project:'));
        console.error(chalk_1.default.red(message));
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
        const port = (0, validation_1.validatePort)(options.port || '3001');
        // Check if it's a Vite project
        const hasVite = (0, fs_1.existsSync)((0, path_1.join)(projectDir, 'vite.config.ts')) ||
            (0, fs_1.existsSync)((0, path_1.join)(projectDir, 'vite.config.js'));
        if (!hasVite) {
            console.warn(chalk_1.default.yellow('⚠️ No vite.config.ts or vite.config.js found in the current directory.'));
            console.warn(chalk_1.default.yellow('Continuing anyway, but you might need to configure Vite manually.'));
        }
        // Create mocks directory
        const mocksDir = (0, path_1.join)(projectDir, 'mocks');
        if (!(0, fs_1.existsSync)(mocksDir)) {
            (0, fs_1.mkdirSync)(mocksDir);
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
        (0, fs_1.writeFileSync)((0, path_1.join)(mocksDir, 'api.json'), JSON.stringify(sampleSchema, null, 2));
        // Add mock script to package.json
        const packageJsonPath = (0, path_1.join)(projectDir, 'package.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
            packageJson.scripts = packageJson.scripts || {};
            packageJson.scripts['mock'] = 'schemock start mocks/api.json --watch';
            // Suggest updating dev script
            if (packageJson.scripts['dev'] && !packageJson.scripts['dev'].includes('mock')) {
                console.log(chalk_1.default.blue('\n💡 Suggestion: Update your "dev" script in package.json to run the mock server alongside Vite:'));
                console.log(chalk_1.default.cyan(`   "dev": "concurrently \\"npm run mock\\" \\"vite\\""`));
                console.log(chalk_1.default.gray('   (requires `concurrently` package)'));
            }
            (0, fs_1.writeFileSync)(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
        console.log(chalk_1.default.green('\n✅ Schemock Vite integration initialized!'));
        console.log(chalk_1.default.blue('\n👉 Next steps:'));
        console.log(chalk_1.default.blue('1. Install Schemock:'));
        console.log(chalk_1.default.cyan('   npm install --save-dev schemock'));
        console.log(chalk_1.default.blue('2. Add the plugin to your vite.config.ts:'));
        console.log(chalk_1.default.gray(`
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
        console.log(chalk_1.default.blue('3. Start your dev server:'));
        console.log(chalk_1.default.cyan('   npm run dev'));
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error initializing Vite integration:'));
        console.error(chalk_1.default.red(message));
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
        const routes = (0, routes_1.generateCRUDDSL)(resourceName);
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
        (0, fs_1.writeFileSync)(outputFile, JSON.stringify(schema, null, 2));
        console.log(chalk_1.default.green(`✅ CRUD schema for ${resourceName} generated in ${outputFile}`));
        console.log(chalk_1.default.blue(`👉 Start with: schemock start ${outputFile}`));
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error generating CRUD schema:'));
        console.error(chalk_1.default.red(message));
        process.exit(1);
    }
});
// Recipes command
program
    .command('recipes')
    .description('Show common integration recipes and guides')
    .action(() => {
    try {
        const recipesPath = (0, path_1.resolve)(__dirname, '../../docs/recipes.md');
        if ((0, fs_1.existsSync)(recipesPath)) {
            const content = (0, fs_1.readFileSync)(recipesPath, 'utf-8');
            console.log(chalk_1.default.bold.blue('\n--- Schemock Recipes ---\n'));
            console.log(content);
            console.log(chalk_1.default.bold.blue('\n--- End of Recipes ---\n'));
        }
        else {
            console.log(chalk_1.default.yellow('\n⚠️  Recipes documentation not found locally.'));
            console.log(chalk_1.default.blue('🌐 Visit: https://github.com/toxzak-svg/schemock-app/blob/main/docs/recipes.md\n'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error reading recipes:'), error);
    }
});
// Install command
program
    .command('install')
    .description('Launch the interactive installer')
    .option('-p, --port <number>', 'Port to run the installer UI on', '3000')
    .action(async (options) => {
    try {
        const port = (0, validation_1.validatePort)(options.port);
        console.log(chalk_1.default.blue(`🚀 Launching installer UI...`));
        const server = (0, server_1.startInstallerServer)(port);
        // Keep the process running
        await new Promise(() => { }); // Never resolves, keeps process alive
    }
    catch (error) {
        const message = error instanceof Error ? (0, errors_1.formatError)(error) : 'Unknown error occurred';
        console.error(chalk_1.default.red('❌ Error launching installer:'));
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
  ${chalk_1.default.cyan('schemock recipes')}              Show integration guides

${chalk_1.default.yellow('Examples:')}
  ${chalk_1.default.cyan('schemock start user.json --port 8080')}
  ${chalk_1.default.cyan('schemock start --resource products')}
  ${chalk_1.default.cyan('schemock init ecommerce-api --name "E-commerce API"')}

${chalk_1.default.yellow('For detailed help:')}
  ${chalk_1.default.cyan('schemock start --help')}
  ${chalk_1.default.cyan('schemock init --help')}
`);
    process.exit(0);
}
program.parse(process.argv);
//# sourceMappingURL=index.js.map