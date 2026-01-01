import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { ServerOptions, RouteConfig, MockServerConfig } from '../types';
import { SchemaParser } from '../parsers/schema';
import { PortError, ServerError, ValidationError } from '../errors';
import { log, setLogLevel } from '../utils/logger';
import { validateData } from '../utils/validation';
import { getPlaygroundHTML } from './playground';

export class ServerGenerator {
  private app: Application;
  private config: MockServerConfig;
  private parser: SchemaParser;
  private server: Server | null = null;
  private state: Record<string, any[]> = {};

  constructor(config: MockServerConfig) {
    this.config = config;
    this.app = express();
    this.parser = new SchemaParser();
    
    // Set log level from config
    if (config.server.logLevel) {
      setLogLevel(config.server.logLevel);
    }
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable CORS if configured
    if (this.config.server.cors) {
      this.app.use(cors());
      log.debug('CORS enabled', { module: 'server' });
    }

    // JSON body parsing with size limit for security
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Log request
      log.debug(`Incoming request`, {
        module: 'server',
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip
      });

      // Override res.json to capture status code and timing
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        const duration = Date.now() - startTime;
        log.request(req.method, req.path, res.statusCode, duration);
        return originalJson(body);
      };

      next();
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error('Request error', {
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

  private setupRoutes(): void {
    // Setup each route from the config
    Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
      this.setupRoute(routeConfig);
    });

    // API Index endpoint (Playground)
    this.app.get('/', (req: Request, res: Response) => {
      const html = getPlaygroundHTML(this.config.routes);
      res.send(html);
    });

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Favicon handler (prevent 404 warnings)
    this.app.get('/favicon.ico', (req: Request, res: Response) => {
      res.status(204).end();
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
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

  private setupRoute(routeConfig: RouteConfig): void {
    const { path, method, response, statusCode = 200, delay = 0, headers = {}, schema } = routeConfig;
    
    const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
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
            log.warn(`Scenario ${scenario} triggered error`, {
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
              validateData(req.body, schema);
            } catch (error: any) {
              if (error instanceof ValidationError) {
                log.warn('Request validation failed (strict mode)', {
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
        } else if (typeof response === 'object' && response !== null) {
          // If response is an object, use it directly
          res.status(statusCode).json(response);
        } else {
          // For other types, send as is
          res.status(statusCode).send(response);
        }
        
        const duration = Date.now() - startTime;
        log.debug('Route handler completed', {
          module: 'server',
          path,
          method,
          duration,
          scenario: scenario || 'default'
        });
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
        throw new ServerError(`Unsupported HTTP method: ${method}`, { method });
    }
    
    log.debug(`Route registered`, {
      module: 'server',
      method: method.toUpperCase(),
      path
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.config.server.port !== undefined ? this.config.server.port : 3000;
      
      this.server = this.app.listen(port, () => {
        log.info(`Mock server started`, {
          module: 'server',
          port,
          url: `http://localhost:${port}`
        });
        
        // Log all available routes in debug mode
        if (this.config.server.logLevel === 'debug') {
          log.debug('Available routes:', {
            module: 'server',
            routes: Object.entries(this.config.routes).map(([path, config]) => 
              `${config.method.toUpperCase()} ${path}`
            )
          });
        }
        
        resolve();
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          const portError = new PortError(`Port ${port} is already in use`, port);
          log.error('Failed to start server', {
            module: 'server',
            error: portError,
            port
          });
          reject(portError);
        } else {
          log.error('Server error', {
            module: 'server',
            error,
            port
          });
          reject(new ServerError(error.message, { originalError: error }));
        }
      });
    });
  }

  /**
   * Stop the server gracefully
   */
  public async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          log.error('Error stopping server', {
            module: 'server',
            error: err
          });
          reject(new ServerError('Failed to stop server', { originalError: err }));
        } else {
          this.server = null;
          log.info('Server stopped', { module: 'server' });
          resolve();
        }
      });
    });
  }

  /**
   * Restart the server with new configuration
   */
  public async restart(newConfig?: MockServerConfig): Promise<void> {
    log.info('Restarting server', { module: 'server' });
    
    await this.stop();
    
    if (newConfig) {
      this.config = newConfig;
      if (newConfig.server.logLevel) {
        setLogLevel(newConfig.server.logLevel);
      }
      this.app = express();
      this.setupMiddleware();
      this.setupRoutes();
    }
    
    await this.start();
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  public getApp(): Application {
    return this.app;
  }

  /**
   * Get current server configuration
   */
  public getConfig(): MockServerConfig {
    return this.config;
  }

  public static generateFromSchema(schema: any, options: Omit<ServerOptions, 'port'> & { port?: number } = { port: 3000 }): ServerGenerator {
    const port = options.port !== undefined ? options.port : 3000;
    const routes: Record<string, RouteConfig> = {};

    const resourceName = options.resourceName || (schema.title ? schema.title.toLowerCase() + (schema.title.toLowerCase().endsWith('s') ? '' : 's') : 'data');
    const basePath = options.basePath || `/api/${resourceName}`;

    const createHandler = (method: string, routePath: string, routeDef: any, wrap: boolean = true) => {
      return (req: Request, state: any) => {
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
            const item = state[resource].find((i: any) => i.id === req.params.id);
            if (item) {
              return wrap ? { 
                success: true, 
                message: 'Mock data retrieved',
                timestamp: new Date().toISOString(),
                data: item 
              } : item;
            }
            
            // Fallback: generate, tie to ID, and store in state for consistency
            let data = isSchema ? SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource) : routeDef.response;
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              // Clone to avoid mutating the original routeDef.response
              data = { ...data };
              (data as any).id = req.params.id;
              state[resource].push(data);
            }
            return wrap ? { 
              success: true, 
              message: 'Mock data generated',
              timestamp: new Date().toISOString(),
              data 
            } : data;
          } else {
            // Collection GET logic - only if it's a default route (wrap=true) or explicitly a schema array
            if (wrap || (isSchema && responseSchema.type === 'array')) {
              // Return list from state
              if (state[resource].length === 0) {
                // Populate with some initial data
                const generated = isSchema ? SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource) : routeDef.response;
                if (Array.isArray(generated)) {
                  state[resource] = generated;
                } else if (isSchema) {
                  for (let i = 0; i < 3; i++) {
                    const item = SchemaParser.parse(responseSchema, schema, new Set(), options.strict, resource);
                    if (item && typeof item === 'object' && !Array.isArray(item) && !(item as any).id) {
                      (item as any).id = uuidv4();
                    }
                    state[resource].push(item);
                  }
                } else {
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
            } else {
              // Static or non-wrapped GET
              if (isSchema) return SchemaParser.parse(routeDef.response, schema, new Set(), options.strict, resource);
              return routeDef.response;
            }
          }
        }

        if (method === 'post') {
          const newItem = {
            id: req.body.id || uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          state[resource].push(newItem);
          return wrap ? { success: true, data: newItem, message: 'Created successfully' } : newItem;
        }

        if (method === 'put' && routePath.endsWith('/:id')) {
          const index = state[resource].findIndex((i: any) => i.id === req.params.id);
          const updatedItem = {
            ...(index >= 0 ? state[resource][index] : {}),
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
          };
          if (index >= 0) {
            state[resource][index] = updatedItem;
          } else {
            state[resource].push(updatedItem);
          }
          return wrap ? { success: true, data: updatedItem } : updatedItem;
        }

        if (method === 'delete' && routePath.endsWith('/:id')) {
          const initialLength = state[resource].length;
          state[resource] = state[resource].filter((i: any) => i.id !== req.params.id);
          return wrap ? { success: true, message: 'Deleted successfully' } : { message: 'Deleted successfully' };
        }

        // Default behavior if not matched
        if (isSchema) return SchemaParser.parse(routeDef.response, schema, new Set(), options.strict, resource);
        return routeDef.response || SchemaParser.parse(schema, undefined, new Set(), options.strict, resource);
      };
    };

    if (schema['x-schemock-routes'] && Array.isArray(schema['x-schemock-routes'])) {
      schema['x-schemock-routes'].forEach((routeDef: any) => {
        const method = routeDef.method.toLowerCase();
        const path = routeDef.path;
        const key = `${method}:${path}`;
        
        routes[key] = {
          path,
          method: method as any,
          statusCode: routeDef.statusCode || (method === 'post' ? 201 : 200),
          delay: routeDef.delay || 0,
          headers: routeDef.headers || {},
          response: createHandler(method, path, routeDef, false), // Don't wrap x-schemock-routes
          schema: routeDef.response
        };
      });
    } else {
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
          method: method as any,
          statusCode: method === 'post' ? 201 : (method === 'delete' ? 204 : 200),
          response: createHandler(method, path, { response: schema }),
          schema: schema
        };
      });
    }

    const config: MockServerConfig = {
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

export function createMockServer(config: MockServerConfig): ServerGenerator {
  return new ServerGenerator(config);
}
