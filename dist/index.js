"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockServer = createMockServer;
const server_1 = require("./generators/server");
const validation_1 = require("./utils/validation");
/**
 * Main entry point for Schemock application
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 * @returns ServerGenerator instance (not started)
 */
function createMockServer(schema, options = { port: 3000 }) {
    // Validate schema if provided (addresses issue 10.1)
    if (schema) {
        try {
            (0, validation_1.validateSchema)(schema, options.strict || false);
        }
        catch (error) {
            // Log warning but continue - schema parser may still work
            console.warn(`Schema validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Validate port (addresses issue 10.1)
    if (options.port !== undefined) {
        options.port = (0, validation_1.validatePort)(options.port);
    }
    return server_1.ServerGenerator.generateFromSchema(schema, options);
}
// If this file is run directly, start a simple mock server
if (require.main === module) {
    // Default schema for demo
    const defaultSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 3, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            age: { type: 'integer', minimum: 0, maximum: 120 },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            tags: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                maxItems: 5
            }
        },
        required: ['id', 'name', 'email', 'isActive', 'createdAt']
    };
    // Validate port from environment variable (addresses issue 10.1)
    const port = process.env.PORT ? (0, validation_1.validatePort)(process.env.PORT) : 3000;
    const server = createMockServer(defaultSchema, {
        port,
        logLevel: 'info',
        cors: true
    });
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        process.exit(0);
    });
}
__exportStar(require("./types"), exports);
__exportStar(require("./generators/server"), exports);
__exportStar(require("./parsers/schema"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./utils/validation"), exports);
__exportStar(require("./utils/watcher"), exports);
__exportStar(require("./integrations/vite"), exports);
__exportStar(require("./utils/config"), exports);
//# sourceMappingURL=index.js.map