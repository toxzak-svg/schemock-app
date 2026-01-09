import { Application } from 'express';
import { ServerOptions, MockServerConfig, Schema } from '../types';
/**
 * A mock server generator that creates and manages an Express server with configurable routes.
 *
 * This class provides functionality to start, stop, restart, and manage a mock API server
 * based on JSON Schema configurations. It supports custom routes, CRUD operations, response
 * delays, error scenarios, and request validation.
 */
export declare class ServerGenerator {
    private app;
    private config;
    private server;
    private state;
    private version;
    private connections;
    private isStopping;
    private skipValidation;
    /**
     * Creates a new ServerGenerator instance.
     *
     * @param config - The mock server configuration containing server settings and route definitions
     * @param skipValidation - If true, skips configuration validation (for internal use only)
     * @throws {ValidationError} When configuration validation fails and skipValidation is false
     */
    constructor(config: MockServerConfig, skipValidation?: boolean);
    /**
     * Configures and applies all middleware to the Express application.
     *
     * Sets up CORS, request parsing, logging, and other middleware based on configuration.
     */
    private setupMiddleware;
    /**
     * Configures all routes on the Express application.
     *
     * Iterates through route configurations and sets up system routes like
     * playground, health check, and gallery.
     */
    private setupRoutes;
    /**
     * Configures a single route on the Express application.
     *
     * @param routeConfig - The route configuration including path, method, response, and options
     * @throws {ServerError} When an unsupported HTTP method is specified
     */
    private setupRoute;
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
    start(): Promise<void>;
    /**
     * Stops the server gracefully, allowing existing connections to complete.
     *
     * Waits up to 5 seconds for connections to close before forcing them shut.
     * If the server is not running, returns immediately.
     *
     * @throws {ServerError} When an error occurs while stopping the server
     * @returns Promise that resolves when the server is stopped
     */
    stop(): Promise<void>;
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
    restart(newConfig?: MockServerConfig): Promise<void>;
    /**
     * Checks if the server is currently running and listening for connections.
     *
     * @returns True if the server is running, false otherwise
     */
    isRunning(): boolean;
    /**
     * Gets the underlying Express Application instance.
     *
     * @returns The Express Application instance
     */
    getApp(): Application;
    /**
     * Gets the current server configuration.
     *
     * @returns The current mock server configuration
     */
    getConfig(): MockServerConfig;
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
    static generateFromSchema(schema: Schema, options?: Partial<ServerOptions>): ServerGenerator;
}
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
export declare function createMockServer(config: MockServerConfig): ServerGenerator;
