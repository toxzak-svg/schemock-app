import express, { Application, Request, Response, NextFunction } from 'express';
import { RouteConfig, MockServerConfig } from '../types';
import { log } from '../utils/logger';
import { getPlaygroundHTML } from './playground';

export interface RouteSetupOptions {
    routes: Record<string, RouteConfig>;
    version: string;
    setupRoute: (routeConfig: RouteConfig) => void;
}

/**
 * Setup the playground/index endpoint
 */
export function setupPlaygroundRoute(app: Application, routes: Record<string, RouteConfig>): void {
    app.get('/', (req: Request, res: Response) => {
        const html = getPlaygroundHTML(routes);
        res.send(html);
    });
}

/**
 * Setup health check endpoint
 * Used by Railway and other platforms for health checks and monitoring
 */
export function setupHealthCheckRoute(app: Application, version?: string): void {
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: version || 'unknown',
            env: process.env.NODE_ENV || 'development',
            node: process.version,
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        });
    });
}

/**
 * Setup share schema endpoint
 */
export function setupShareRoute(app: Application, config: MockServerConfig, version: string): void {
    app.get('/api/share', (req: Request, res: Response) => {
        const shareData = {
            routes: config.routes,
            server: {
                port: config.server.port,
                cors: config.server.cors
            },
            version: version,
            createdAt: new Date().toISOString()
        };
        res.json(shareData);
    });
}

/**
 * Setup schema gallery endpoint
 */
export function setupGalleryRoute(app: Application, version: string): void {
    app.get('/api/gallery', (req: Request, res: Response) => {
        const publicSchemas = [
            {
                id: 'ecommerce-product',
                title: 'E-commerce Product API',
                description: 'Complete product management API with categories, pricing, and inventory',
                url: 'https://github.com/toxzak-svg/schemock-app',
                schema: {
                    type: 'object',
                    title: 'Product',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        price: { type: 'number', minimum: 0 },
                        category: { type: 'string', enum: ['electronics', 'clothing', 'books'] },
                        inStock: { type: 'boolean' }
                    },
                    required: ['id', 'name', 'price', 'category']
                }
            },
            {
                id: 'social-media-post',
                title: 'Social Media Post Schema',
                description: 'Blog post and social media content API with likes and comments',
                url: 'https://github.com/toxzak-svg/schemock-app',
                schema: {
                    type: 'object',
                    title: 'Post',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        author: { type: 'string' },
                        likes: { type: 'number' },
                        comments: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['id', 'title', 'content', 'author']
                }
            },
            {
                id: 'user-profile',
                title: 'User Profile API',
                description: 'User authentication and profile management',
                url: 'https://github.com/toxzak-svg/schemock-app',
                schema: {
                    type: 'object',
                    title: 'User',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        username: { type: 'string' },
                        profile: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                avatar: { type: 'string', format: 'uri' }
                            }
                        }
                    },
                    required: ['id', 'email', 'username']
                }
            }
        ];

        res.json({
            schemas: publicSchemas,
            total: publicSchemas.length,
            message: 'Made with Schemock'
        });
    });
}

/**
 * Setup favicon handler (prevent 404 warnings)
 */
export function setupFaviconRoute(app: Application): void {
    app.get('/favicon.ico', (req: Request, res: Response) => {
        res.status(204).end();
    });
}

/**
 * Setup 404 handler
 */
export function setupNotFoundRoute(app: Application): void {
    app.use((req: Request, res: Response) => {
        log.warn('Route not found', {
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

/**
 * Setup all system routes
 */
export function setupSystemRoutes(app: Application, config: MockServerConfig, version: string): void {
    setupPlaygroundRoute(app, config.routes);
    setupHealthCheckRoute(app, version);
    setupShareRoute(app, config, version);
    setupGalleryRoute(app, version);
    setupFaviconRoute(app);
    setupNotFoundRoute(app);
}
