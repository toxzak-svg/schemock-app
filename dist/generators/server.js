"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerGenerator = void 0;
exports.createMockServer = createMockServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const schema_1 = require("../parsers/schema");
const errors_1 = require("../errors");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const playground_1 = require("./playground");
class ServerGenerator {
    constructor(config) {
        this.server = null;
        this.state = {};
        this.config = config;
        this.app = (0, express_1.default)();
        this.parser = new schema_1.SchemaParser();
        // Set log level from config
        if (config.server.logLevel) {
            (0, logger_1.setLogLevel)(config.server.logLevel);
        }
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Enable CORS if configured
        if (this.config.server.cors) {
            this.app.use((0, cors_1.default)());
            logger_1.log.debug('CORS enabled', { module: 'server' });
        }
        // JSON body parsing with size limit for security
        this.app.use(express_1.default.json({ limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            // Log request
            logger_1.log.debug(`Incoming request`, {
                module: 'server',
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip
            });
            // Override res.json to capture status code and timing
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                const duration = Date.now() - startTime;
                logger_1.log.request(req.method, req.path, res.statusCode, duration);
                return originalJson(body);
            };
            next();
        });
        // Error handling middleware
        this.app.use((err, req, res, next) => {
            logger_1.log.error('Request error', {
                module: 'server',
                error: err,
                method: req.method,
                path: req.path
            });
            res.status(500).json({
                error: 'Internal Server Error',
                message: this.config.server.logLevel === 'debug' ? err.message : 'An error occurred'
            });
        });
    }
    setupRoutes() {
        // Setup each route from the config
        Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
            this.setupRoute(routeConfig);
        });
        // API Index endpoint (Playground)
        this.app.get('/', (req, res) => {
            const html = (0, playground_1.getPlaygroundHTML)(this.config.routes);
            res.send(html);
        });
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        // Favicon handler (prevent 404 warnings)
        this.app.get('/favicon.ico', (req, res) => {
            res.status(204).end();
        });
        // 404 handler
        this.app.use((req, res) => {
            logger_1.log.warn('Route not found', {
                module: 'server',
                method: req.method,
                path: req.path
            });
            res.status(404).json({
                error: 'Not Found',
                message: `No route found for ${req.method} ${req.path}`
            });
        });
    }
    setupRoute(routeConfig) {
        const { path, method, response, statusCode = 200, delay = 0, headers = {}, schema } = routeConfig;
        const routeHandler = async (req, res, next) => {
            const startTime = Date.now();
            const scenario = this.config.server.scenario;
            try {
                // Apply delay if specified or if scenario is slow
                let effectiveDelay = delay;
                if (scenario === 'slow' || scenario === 'sad-path') {
                    // Add extra delay for slow scenarios (1000ms to 3000ms)
                    effectiveDelay += 1000 + Math.random() * 2000;
                }
                if (effectiveDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                }
                // Apply errors if scenario is error-heavy
                if (scenario === 'error-heavy' || scenario === 'sad-path') {
                    // 30% chance of returning an error
                    if (Math.random() < 0.3) {
                        const errorStatus = [400, 401, 403, 404, 500, 503][Math.floor(Math.random() * 6)];
                        logger_1.log.warn(`Scenario ${scenario} triggered error`, {
                            module: 'server',
                            path,
                            method,
                            statusCode: errorStatus
                        });
                        return res.status(errorStatus).json({
                            success: false,
                            error: 'ScenarioError',
                            message: `This error was generated by the '${scenario}' preset scenario.`,
                            statusCode: errorStatus
                        });
                    }
                }
                // Set response headers
                Object.entries(headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                // Request validation for strict mode
                if (this.config.server.strict && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
                    // Use the schema from routeConfig if available
                    if (schema) {
                        try {
                            (0, validation_1.validateData)(req.body, schema);
                        }
                        catch (error) {
                            if (error instanceof errors_1.ValidationError) {
                                logger_1.log.warn('Request validation failed (strict mode)', {
                                    module: 'server',
                                    path,
                                    method,
                                    error: error.message
                                });
                                return res.status(400).json({
                                    success: false,
                                    error: 'ValidationError',
                                    message: `Request validation failed: ${error.message}`,
                                    details: error.details
                                });
                            }
                            throw error;
                        }
                    }
                }
                // Handle different response types
                if (typeof response === 'function') {
                    // If response is a function, call it with the request and state
                    const result = await Promise.resolve(response(req, this.state));
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
                const duration = Date.now() - startTime;
                logger_1.log.debug('Route handler completed', {
                    module: 'server',
                    path,
                    method,
                    duration,
                    scenario: scenario || 'default'
                });
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
                throw new errors_1.ServerError(`Unsupported HTTP method: ${method}`, { method });
        }
        logger_1.log.debug(`Route registered`, {
            module: 'server',
            method: method.toUpperCase(),
            path
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            const port = this.config.server.port !== undefined ? this.config.server.port : 3000;
            this.server = this.app.listen(port, () => {
                logger_1.log.info(`Mock server started`, {
                    module: 'server',
                    port,
                    url: `http://localhost:${port}`
                });
                // Log all available routes in debug mode
                if (this.config.server.logLevel === 'debug') {
                    logger_1.log.debug('Available routes:', {
                        module: 'server',
                        routes: Object.entries(this.config.routes).map(([path, config]) => `${config.method.toUpperCase()} ${path}`)
                    });
                }
                resolve();
            });
            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    const portError = new errors_1.PortError(`Port ${port} is already in use`, port);
                    logger_1.log.error('Failed to start server', {
                        module: 'server',
                        error: portError,
                        port
                    });
                    reject(portError);
                }
                else {
                    logger_1.log.error('Server error', {
                        module: 'server',
                        error,
                        port
                    });
                    reject(new errors_1.ServerError(error.message, { originalError: error }));
                }
            });
        });
    }
    /**
     * Stop the server gracefully
     */
    async stop() {
        if (!this.server) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) {
                    logger_1.log.error('Error stopping server', {
                        module: 'server',
                        error: err
                    });
                    reject(new errors_1.ServerError('Failed to stop server', { originalError: err }));
                }
                else {
                    this.server = null;
                    logger_1.log.info('Server stopped', { module: 'server' });
                    resolve();
                }
            });
        });
    }
    /**
     * Restart the server with new configuration
     */
    async restart(newConfig) {
        logger_1.log.info('Restarting server', { module: 'server' });
        await this.stop();
        if (newConfig) {
            this.config = newConfig;
            if (newConfig.server.logLevel) {
                (0, logger_1.setLogLevel)(newConfig.server.logLevel);
            }
            this.app = (0, express_1.default)();
            this.setupMiddleware();
            this.setupRoutes();
        }
        await this.start();
    }
    /**
     * Check if server is running
     */
    isRunning() {
        return this.server !== null && this.server.listening;
    }
    getApp() {
        return this.app;
    }
    /**
     * Get current server configuration
     */
    getConfig() {
        return this.config;
    }
    static generateFromSchema(schema, options = { port: 3000 }) {
        const port = options.port !== undefined ? options.port : 3000;
        const routes = {};
        const resourceName = options.resourceName || (schema.title ? schema.title.toLowerCase() + (schema.title.toLowerCase().endsWith('s') ? '' : 's') : 'data');
        const basePath = options.basePath || `/api/${resourceName}`;
        const createHandler = (method, routePath, routeDef, wrap = true) => {
            return (req, state) => {
                const parts = routePath.split('/').filter(p => p && p !== 'api');
                const resource = parts[0] || 'data';
                if (!state[resource]) {
                    state[resource] = [];
                }
                const isSchema = routeDef.response && typeof routeDef.response === 'object' &&
                    (routeDef.response.type || routeDef.response.$ref || routeDef.response.oneOf ||
                        routeDef.response.anyOf || routeDef.response.allOf);
                const responseSchema = isSchema ? routeDef.response : schema;
                if (method === 'get') {
                    if (routePath.endsWith('/:id')) {
                        const item = state[resource].find((i) => i.id === req.params.id);
                        if (item) {
                            return wrap ? {
                                success: true,
                                message: 'Mock data retrieved',
                                timestamp: new Date().toISOString(),
                                data: item
                            } : item;
                        }
                        // Fallback: generate, tie to ID, and store in state for consistency
                        let data = isSchema ? schema_1.SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource) : routeDef.response;
                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                            // Clone to avoid mutating the original routeDef.response
                            data = { ...data };
                            data.id = req.params.id;
                            state[resource].push(data);
                        }
                        return wrap ? {
                            success: true,
                            message: 'Mock data generated',
                            timestamp: new Date().toISOString(),
                            data
                        } : data;
                    }
                    else {
                        // Collection GET logic - only if it's a default route (wrap=true) or explicitly a schema array
                        if (wrap || (isSchema && responseSchema.type === 'array')) {
                            // Return list from state
                            if (state[resource].length === 0) {
                                // Populate with some initial data
                                const generated = isSchema ? schema_1.SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource) : routeDef.response;
                                if (Array.isArray(generated)) {
                                    state[resource] = generated;
                                }
                                else if (isSchema) {
                                    for (let i = 0; i < 3; i++) {
                                        const item = schema_1.SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource);
                                        if (item && typeof item === 'object' && !Array.isArray(item) && !item.id) {
                                            item.id = (0, uuid_1.v4)();
                                        }
                                        state[resource].push(item);
                                    }
                                }
                                else {
                                    // Static non-array response, don't treat as collection
                                    return routeDef.response;
                                }
                            }
                            return wrap ? {
                                success: true,
                                message: 'Mock data retrieved',
                                timestamp: new Date().toISOString(),
                                data: state[resource],
                                meta: { total: state[resource].length }
                            } : state[resource];
                        }
                        else {
                            // Static or non-wrapped GET
                            if (isSchema)
                                return schema_1.SchemaParser.parse(routeDef.response, schema, new Set(), options.strict, resource);
                            return routeDef.response;
                        }
                    }
                }
                if (method === 'post') {
                    const newItem = {
                        id: req.body.id || (0, uuid_1.v4)(),
                        ...req.body,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    state[resource].push(newItem);
                    return wrap ? { success: true, data: newItem, message: 'Created successfully' } : newItem;
                }
                if (method === 'put' && routePath.endsWith('/:id')) {
                    const index = state[resource].findIndex((i) => i.id === req.params.id);
                    const updatedItem = {
                        ...(index >= 0 ? state[resource][index] : {}),
                        ...req.body,
                        id: req.params.id,
                        updatedAt: new Date().toISOString()
                    };
                    if (index >= 0) {
                        state[resource][index] = updatedItem;
                    }
                    else {
                        state[resource].push(updatedItem);
                    }
                    return wrap ? { success: true, data: updatedItem } : updatedItem;
                }
                if (method === 'delete' && routePath.endsWith('/:id')) {
                    const initialLength = state[resource].length;
                    state[resource] = state[resource].filter((i) => i.id !== req.params.id);
                    return wrap ? { success: true, message: 'Deleted successfully' } : { message: 'Deleted successfully' };
                }
                // Default behavior if not matched
                if (isSchema)
                    return schema_1.SchemaParser.parse(routeDef.response, schema, new Set(), options.strict, resource);
                return routeDef.response || schema_1.SchemaParser.parse(schema, undefined, new Set(), options.strict, resource);
            };
        };
        if (schema['x-schemock-routes'] && Array.isArray(schema['x-schemock-routes'])) {
            schema['x-schemock-routes'].forEach((routeDef) => {
                const method = routeDef.method.toLowerCase();
                const path = routeDef.path;
                const key = `${method}:${path}`;
                routes[key] = {
                    path,
                    method: method,
                    statusCode: routeDef.statusCode || (method === 'post' ? 201 : 200),
                    delay: routeDef.delay || 0,
                    headers: routeDef.headers || {},
                    response: createHandler(method, path, routeDef, false), // Don't wrap x-schemock-routes
                    schema: routeDef.response
                };
            });
        }
        else {
            // Default CRUD routes based on schema title
            const crudPaths = [
                { method: 'get', path: basePath },
                { method: 'get', path: `${basePath}/:id` },
                { method: 'post', path: basePath },
                { method: 'put', path: `${basePath}/:id` },
                { method: 'delete', path: `${basePath}/:id` }
            ];
            crudPaths.forEach(({ method, path }) => {
                const key = `${method}:${path}`;
                routes[key] = {
                    path,
                    method: method,
                    statusCode: method === 'post' ? 201 : (method === 'delete' ? 204 : 200),
                    response: createHandler(method, path, { response: schema }),
                    schema: schema
                };
            });
        }
        const config = {
            server: {
                port,
                cors: true,
                logLevel: 'info',
                ...options
            },
            routes
        };
        return new ServerGenerator(config);
    }
}
exports.ServerGenerator = ServerGenerator;
function createMockServer(config) {
    return new ServerGenerator(config);
}
