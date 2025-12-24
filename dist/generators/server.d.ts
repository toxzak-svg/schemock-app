import { Application } from 'express';
import { ServerOptions, MockServerConfig } from '../types';
export declare class ServerGenerator {
    private app;
    private config;
    private parser;
    constructor(config: MockServerConfig);
    private setupMiddleware;
    private logRequest;
    private setupRoutes;
    private setupRoute;
    start(): Promise<void>;
    getApp(): Application;
    static generateFromSchema(schema: any, options?: Omit<ServerOptions, 'port'> & {
        port?: number;
    }): ServerGenerator;
}
export declare function createMockServer(config: MockServerConfig): ServerGenerator;
