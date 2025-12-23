import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ServerOptions, RouteConfig, MockServerConfig } from '../types';
import { SchemaParser } from '../parsers/schema';

export class ServerGenerator {
  private app: Application;
  private config: MockServerConfig;
  private parser: SchemaParser;

  constructor(config: MockServerConfig) {
    this.config = config;
    this.app = express();
    this.parser = new SchemaParser();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable CORS if configured
    if (this.config.server.cors) {
      this.app.use(cors());
    }

    // JSON body parsing
    this.app.use(express.json());

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logRequest(req);
      next();
    });
  }

  private logRequest(req: Request): void {
    const logLevel = this.config.server.logLevel || 'info';
    const logLevels = ['error', 'warn', 'info', 'debug'];
    
    if (logLevels.indexOf(logLevel) >= logLevels.indexOf('info')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
  }

  private setupRoutes(): void {
    // Setup each route from the config
    Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
      this.setupRoute(routeConfig);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `No route found for ${req.method} ${req.path}`
      });
    });
  }

  private setupRoute(routeConfig: RouteConfig): void {
    const { path, method, response, statusCode = 200, delay = 0, headers = {} } = routeConfig;
    const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
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
        } else if (typeof response === 'object' && response !== null) {
          // If response is an object, use it directly
          res.status(statusCode).json(response);
        } else {
          // For other types, send as is
          res.status(statusCode).send(response);
        }
      } catch (error) {
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

  public start(): void {
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

  public getApp(): Application {
    return this.app;
  }

  public static generateFromSchema(schema: any, options: Omit<ServerOptions, 'port'> & { port?: number } = { port: 3000 }): ServerGenerator {
    const port = options.port || 3000;
    const defaultConfig: MockServerConfig = {
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
          response: (req: Request) => ({
            message: 'This is a mock response',
            timestamp: new Date().toISOString(),
            data: SchemaParser.parse(schema)
          })
        },
        'post:/api/data': {
          path: '/api/data',
          method: 'post',
          response: (req: Request) => ({
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

export function createMockServer(config: MockServerConfig): ServerGenerator {
  return new ServerGenerator(config);
}
