"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerGenerator = void 0;
exports.createMockServer = createMockServer;
const express_1 = __importDefault(require("express"));
const errors_1 = require("../errors");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const config_1 = require("../utils/config");
const middleware_1 = require("./middleware");
const route_setup_1 = require("./route-setup");
const response_utils_1 = require("./response-utils");
const schema_routes_1 = require("./schema-routes");
/**
 * A mock server generator that creates and manages an Express server with configurable routes.
 *
 * This class provides functionality to start, stop, restart, and manage a mock API server
 * based on JSON Schema configurations. It supports custom routes, CRUD operations, response
 * delays, error scenarios, and request validation.
 */
class ServerGenerator {
    /**
     * Creates a new ServerGenerator instance.
     *
     * @param config - The mock server configuration containing server settings and route definitions
     * @param skipValidation - If true, skips configuration validation (for internal use only)
     * @throws {ValidationError} When configuration validation fails and skipValidation is false
     */
    constructor(config, skipValidation = false) {
        this.server = null;
        this.state = {};
        this.version = require('../../package.json').version;
        this.connections = new Set();
        this.isStopping = false;
        // Validate configuration at startup (addresses issue 8.2)
        // Skip validation for internally-generated configs to maintain backward compatibility
        this.skipValidation = skipValidation;
        this.config = skipValidation ? config : (0, config_1.validateMockServerConfig)(config);
        this.app = (0, express_1.default)();
        // Set log level from config
        if (this.config.server.logLevel) {
            (0, logger_1.setLogLevel)(this.config.server.logLevel);
        }
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * Configures and applies all middleware to the Express application.
     *
     * Sets up CORS, request parsing, logging, and other middleware based on configuration.
     */
    setupMiddleware() {
        (0, middleware_1.setupAllMiddleware)(this.app, {
            cors: this.config.server.cors,
            hideBranding: this.config.server.hideBranding,
            logLevel: this.config.server.logLevel,
            version: this.version
        });
    }
    /**
     * Configures all routes on the Express application.
     *
     * Iterates through route configurations and sets up system routes like
     * playground, health check, and gallery.
     */
    setupRoutes() {
        // Setup each route from the config
        Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
            this.setupRoute(routeConfig);
        });
        // Setup system routes (playground, health, share, gallery, etc.)
        (0, route_setup_1.setupSystemRoutes)(this.app, this.config, this.version);
    }
    /**
     * Configures a single route on the Express application.
     *
     * @param routeConfig - The route configuration including path, method, response, and options
     * @throws {ServerError} When an unsupported HTTP method is specified
     */
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
                    // If response is a function, call it with request and state
                    const routeReq = {
                        params: req.params,
                        query: req.query,
                        body: req.body,
                        method: req.method,
                        path: req.path,
                        headers: req.headers
                    };
                    const result = await Promise.resolve(response(routeReq, this.state));
                    // Add branding metadata to response (unless disabled)
                    const brandedResult = (0, response_utils_1.addBranding)(result, this.config.server.hideBranding ?? false, this.version);
                    res.status(statusCode).json(brandedResult);
                }
                else if (typeof response === 'object' && response !== null) {
                    // If response is an object, add branding metadata
                    const brandedResponse = (0, response_utils_1.addBranding)(response, this.config.server.hideBranding ?? false, this.version);
                    res.status(statusCode).json(brandedResponse);
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
    /**
     * Starts the mock server on the configured port.
     *
     * Begins listening for HTTP requests and tracks all active connections for proper cleanup.
     * Logs available routes in debug mode.
     *
     * @throws {PortError} When the configured port is already in use
     * @throws {ServerError} When the server fails to start for other reasons
     * @returns Promise that resolves when the server is successfully started
     */
    async start() {
        // Check if server is already running
        if (this.server && this.server.listening) {
            const port = this.config.server.port !== undefined ? this.config.server.port : 3000;
            throw new errors_1.PortError(`Server is already running on port ${port}`, port);
        }
        return new Promise((resolve, reject) => {
            const port = this.config.server.port !== undefined ? this.config.server.port : 3000;
            this.isStopping = false;
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
            // Track all connections for proper cleanup
            this.server.on('connection', (socket) => {
                if (this.isStopping) {
                    // Reject new connections if we're stopping
                    socket.destroy();
                }
                else {
                    this.connections.add(socket);
                    socket.on('close', () => {
                        this.connections.delete(socket);
                    });
                    socket.on('error', () => {
                        this.connections.delete(socket);
                    });
                }
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
     * Stops the server gracefully, allowing existing connections to complete.
     *
     * Waits up to 5 seconds for connections to close before forcing them shut.
     * If the server is not running, returns immediately.
     *
     * @throws {ServerError} When an error occurs while stopping the server
     * @returns Promise that resolves when the server is stopped
     */
    async stop() {
        if (!this.server) {
            return;
        }
        this.isStopping = true;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                // Force close all connections if timeout is reached
                logger_1.log.warn('Server stop timeout, forcing connections closed', {
                    module: 'server'
                });
                this.connections.forEach(socket => {
                    try {
                        if (typeof socket === 'object' && socket !== null && 'destroy' in socket && typeof socket.destroy === 'function') {
                            socket.destroy();
                        }
                    }
                    catch (e) {
                        // Ignore errors when destroying sockets
                    }
                });
                this.connections.clear();
                if (this.server) {
                    this.server.close((err) => {
                        const errno = err;
                        if (err && errno.code !== 'ERR_SERVER_NOT_RUNNING') {
                            logger_1.log.error('Error stopping server (forced)', {
                                module: 'server',
                                error: err
                            });
                        }
                        this.server = null;
                        logger_1.log.info('Server stopped (forced)', { module: 'server' });
                        resolve();
                    });
                }
                else {
                    this.server = null;
                    resolve();
                }
            }, 5000); // 5 second timeout for graceful shutdown
            this.server.close((err) => {
                clearTimeout(timeout);
                if (err) {
                    const errno = err;
                    if (errno.code === 'ERR_SERVER_NOT_RUNNING') {
                        // Server already stopped, just clean up
                        this.connections.forEach(socket => {
                            try {
                                if (typeof socket === 'object' && socket !== null && 'destroy' in socket && typeof socket.destroy === 'function') {
                                    socket.destroy();
                                }
                            }
                            catch (e) {
                                // Ignore errors when destroying sockets
                            }
                        });
                        this.connections.clear();
                        this.server = null;
                        logger_1.log.info('Server stopped (was not running)', { module: 'server' });
                        resolve();
                    }
                    else {
                        logger_1.log.error('Error stopping server', {
                            module: 'server',
                            error: err
                        });
                        reject(new errors_1.ServerError('Failed to stop server', { originalError: err }));
                    }
                }
                else {
                    // Close all remaining connections
                    this.connections.forEach(socket => {
                        try {
                            if (typeof socket === 'object' && socket !== null && 'destroy' in socket && typeof socket.destroy === 'function') {
                                socket.destroy();
                            }
                        }
                        catch (e) {
                            // Ignore errors when destroying sockets
                        }
                    });
                    this.connections.clear();
                    this.server = null;
                    logger_1.log.info('Server stopped', { module: 'server' });
                    resolve();
                }
            });
        });
    }
    /**
     * Restarts the server with optional new configuration.
     *
     * Stops the current server, applies new configuration if provided, and starts again.
     * Includes a small delay to ensure the port is fully released.
     *
     * @param newConfig - Optional new configuration to apply (uses current config if not provided)
     * @throws {ServerError} When the server fails to restart
     * @returns Promise that resolves when the server is successfully restarted
     */
    async restart(newConfig) {
        logger_1.log.info('Restarting server', { module: 'server' });
        try {
            await this.stop();
        }
        catch (error) {
            // Log error but continue with restart
            logger_1.log.warn('Error during server stop, continuing with restart', {
                module: 'server',
                error
            });
        }
        // Small delay to ensure port is fully released
        await new Promise(resolve => setTimeout(resolve, 100));
        if (newConfig) {
            // Validate new configuration before applying (addresses issue 8.2)
            // Skip validation for internally-generated configs to maintain backward compatibility
            this.config = this.skipValidation ? newConfig : (0, config_1.validateMockServerConfig)(newConfig);
            if (this.config.server.logLevel) {
                (0, logger_1.setLogLevel)(this.config.server.logLevel);
            }
            this.app = (0, express_1.default)();
            this.setupMiddleware();
            this.setupRoutes();
        }
        await this.start();
    }
    /**
     * Checks if the server is currently running and listening for connections.
     *
     * @returns True if the server is running, false otherwise
     */
    isRunning() {
        return this.server !== null && this.server.listening;
    }
    /**
     * Gets the underlying Express Application instance.
     *
     * @returns The Express Application instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Gets the current server configuration.
     *
     * @returns The current mock server configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Generates a mock server instance from a JSON Schema definition.
     *
     * Creates CRUD routes or custom routes based on the schema's x-schemock-routes extension.
     * Automatically determines resource names and base paths from the schema.
     *
     * @param schema - The JSON Schema definition to generate routes from
     * @param options - Optional server configuration options (defaults to port 3000)
     * @returns A new ServerGenerator instance configured with routes from the schema
     */
    static generateFromSchema(schema, options = { port: 3000 }) {
        const port = options.port !== undefined ? options.port : 3000;
        const resourceName = (0, schema_routes_1.determineResourceName)(schema, options);
        const basePath = (0, schema_routes_1.determineBasePath)(resourceName, options);
        const createHandler = (method, routePath, routeDef, wrap = true) => {
            return (0, schema_routes_1.createRouteHandler)(method, routePath, routeDef, schema, options, wrap);
        };
        const routes = schema['x-schemock-routes'] && Array.isArray(schema['x-schemock-routes'])
            ? (0, schema_routes_1.generateCustomRoutes)(schema, createHandler)
            : (0, schema_routes_1.generateCrudRoutes)(basePath, schema, createHandler);
        const config = {
            server: {
                port,
                cors: true,
                logLevel: 'info',
                ...options
            },
            routes
        };
        return new ServerGenerator(config, true);
    }
}
exports.ServerGenerator = ServerGenerator;
/**
 * Creates a new mock server instance with the specified configuration.
 *
 * This is a convenience function that creates a ServerGenerator instance
 * with the provided configuration.
 *
 * @param config - The mock server configuration containing server settings and route definitions
 * @returns A new ServerGenerator instance
 * @throws {ValidationError} When configuration validation fails
 */
function createMockServer(config) {
    return new ServerGenerator(config);
}
//# sourceMappingURL=server.js.map