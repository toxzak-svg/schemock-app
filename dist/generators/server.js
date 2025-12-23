"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerGenerator = void 0;
exports.createMockServer = createMockServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const schema_1 = require("../parsers/schema");
class ServerGenerator {
    constructor(config) {
        this.config = config;
        this.app = (0, express_1.default)();
        this.parser = new schema_1.SchemaParser();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Enable CORS if configured
        if (this.config.server.cors) {
            this.app.use((0, cors_1.default)());
        }
        // JSON body parsing
        this.app.use(express_1.default.json());
        // Request logging
        this.app.use((req, res, next) => {
            this.logRequest(req);
            next();
        });
    }
    logRequest(req) {
        const logLevel = this.config.server.logLevel || 'info';
        const logLevels = ['error', 'warn', 'info', 'debug'];
        if (logLevels.indexOf(logLevel) >= logLevels.indexOf('info')) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        }
    }
    setupRoutes() {
        // Setup each route from the config
        Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
            this.setupRoute(routeConfig);
        });
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `No route found for ${req.method} ${req.path}`
            });
        });
    }
    setupRoute(routeConfig) {
        const { path, method, response, statusCode = 200, delay = 0, headers = {} } = routeConfig;
        const routeHandler = async (req, res, next) => {
            try {
                // Apply delay if specified
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                // Set response headers
                Object.entries(headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                // Handle different response types
                if (typeof response === 'function') {
                    // If response is a function, call it with the request
                    const result = await Promise.resolve(response(req));
                    res.status(statusCode).json(result);
                }
                else if (typeof response === 'object' && response !== null) {
                    // If response is an object, use it directly
                    res.status(statusCode).json(response);
                }
                else {
                    // For other types, send as is
                    res.status(statusCode).send(response);
                }
            }
            catch (error) {
                next(error);
            }
        };
        // Register the route with the specified HTTP method
        switch (method.toLowerCase()) {
            case 'get':
                this.app.get(path, routeHandler);
                break;
            case 'post':
                this.app.post(path, routeHandler);
                break;
            case 'put':
                this.app.put(path, routeHandler);
                break;
            case 'delete':
                this.app.delete(path, routeHandler);
                break;
            case 'patch':
                this.app.patch(path, routeHandler);
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }
    start() {
        const port = this.config.server.port || 3000;
        this.app.listen(port, () => {
            console.log(`Mock server is running on http://localhost:${port}`);
            // Log all available routes
            if (this.config.server.logLevel === 'debug') {
                console.log('\nAvailable routes:');
                Object.entries(this.config.routes).forEach(([path, config]) => {
                    console.log(`  ${config.method.toUpperCase()} ${path}`);
                });
                console.log('');
            }
        });
    }
    getApp() {
        return this.app;
    }
    static generateFromSchema(schema, options = { port: 3000 }) {
        const port = options.port || 3000;
        const defaultConfig = {
            server: {
                port,
                cors: true,
                logLevel: 'info',
                ...options
            },
            routes: {
                'get:/api/data': {
                    path: '/api/data',
                    method: 'get',
                    response: (req) => ({
                        message: 'This is a mock response',
                        timestamp: new Date().toISOString(),
                        data: schema_1.SchemaParser.parse(schema)
                    })
                },
                'post:/api/data': {
                    path: '/api/data',
                    method: 'post',
                    response: (req) => ({
                        message: 'Data received',
                        receivedData: req.body,
                        timestamp: new Date().toISOString()
                    })
                }
            }
        };
        return new ServerGenerator(defaultConfig);
    }
}
exports.ServerGenerator = ServerGenerator;
function createMockServer(config) {
    return new ServerGenerator(config);
}
