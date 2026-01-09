import { Application } from 'express';
import { ServerOptions, MockServerConfig, Schema } from '../types';
export declare class ServerGenerator {
    private app;
    private config;
    private server;
    private state;
    private version;
    private connections;
    private isStopping;
    private skipValidation;
    constructor(config: MockServerConfig, skipValidation?: boolean);
    private setupMiddleware;
    private setupRoutes;
    private setupRoute;
    start(): Promise<void>;
    /**
     * Stop the server gracefully
     */
    stop(): Promise<void>;
    /**
     * Restart the server with new configuration
     */
    restart(newConfig?: MockServerConfig): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    getApp(): Application;
    /**
     * Get current server configuration
     */
    getConfig(): MockServerConfig;
    static generateFromSchema(schema: Schema, options?: Partial<ServerOptions>): ServerGenerator;
}
export declare function createMockServer(config: MockServerConfig): ServerGenerator;
