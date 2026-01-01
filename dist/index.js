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
/**
 * Main entry point for the Schemock application
 * @param schema - The JSON schema to generate mock data from
 * @param options - Server configuration options
 * @returns ServerGenerator instance (not started)
 */
function createMockServer(schema, options = { port: 3000 }) {
    return server_1.ServerGenerator.generateFromSchema(schema, options);
}
// If this file is run directly, start a simple mock server
if (require.main === module) {
    // Default schema for the demo
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
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
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
