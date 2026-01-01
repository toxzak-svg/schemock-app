# Schemock API Documentation

## Overview

Schemock provides two main interfaces: a programmatic API for TypeScript/JavaScript applications and a CLI for command-line usage. This document covers all available endpoints, methods, and configuration options.

## Programmatic API

### Main Function: `createMockServer`

Creates and starts a mock server based on a JSON Schema.

```typescript
import { createMockServer } from 'schemock';

const server = createMockServer(schema, options);
```

**Parameters:**
- `schema: any` - JSON Schema object to generate mock data from
- `options?: ServerOptions` - Server configuration options

**Returns:**
- `ServerGenerator` - Server instance with control methods

**Example:**
```typescript
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1, maxLength: 50 },
    email: { type: 'string', format: 'email' }
  },
  required: ['id', 'name', 'email']
};

const server = createMockServer(userSchema, {
  port: 3000,
  cors: true,
  logLevel: 'info'
});
```

### ServerGenerator Class

#### Constructor

```typescript
import { ServerGenerator, MockServerConfig } from 'schemock';

const config: MockServerConfig = {
  server: {
    port: 3000,
    cors: true,
    logLevel: 'info'
  },
  routes: {
    'get:/api/users': {
      path: '/api/users',
      method: 'get',
      response: generateMockUsers
    }
  }
};

const server = new ServerGenerator(config);
```

#### Methods

##### `start(): void`
Starts the server on the configured port.

```typescript
server.start();
// Output: Mock server is running on http://localhost:3000
```

##### `getApp(): express.Application`
Returns the underlying Express application instance.

```typescript
const app = server.getApp();
// Useful for adding custom middleware or routes
```

##### `generateFromSchema(schema: any, options?: ServerOptions): ServerGenerator`
Static method to create a server with default routes from a schema.

```typescript
const server = ServerGenerator.generateFromSchema(userSchema, {
  port: 8080,
  cors: true
});
```

## Default API Endpoints

When using `generateFromSchema`, the following endpoints are automatically created:

### GET `/api/data`

Returns mock data generated from the provided schema.

**Request:**
```http
GET /api/data
Accept: application/json
```

**Response:**
```json
{
  "message": "This is a mock response",
  "timestamp": "2023-12-01T10:30:00.000Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "JohnDoe",
    "email": "test@example.com"
  }
}
```

### POST `/api/data`

Echoes back the request data with a confirmation message.

**Request:**
```http
POST /api/data
Content-Type: application/json

{
  "name": "Test User",
  "message": "Hello World"
}
```

**Response:**
```json
{
  "message": "Data received",
  "receivedData": {
    "name": "Test User",
    "message": "Hello World"
  },
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

## Custom Route Configuration

### Route Types

#### Static Response Routes

```typescript
const config: MockServerConfig = {
  server: { port: 3000 },
  routes: {
    'get:/api/status': {
      path: '/api/status',
      method: 'get',
      response: {
        status: 'healthy',
        version: '1.0.0',
        uptime: '2h 30m'
      },
      statusCode: 200
    }
  }
};
```

#### Dynamic Response Routes

```typescript
'get:/api/users/:id': {
  path: '/api/users/:id',
  method: 'get',
  response: (req) => ({
    id: req.params.id,
    name: `User ${req.params.id}`,
    email: `user${req.params.id}@example.com`,
    createdAt: new Date().toISOString()
  })
}
```

#### Routes with Delays

```typescript
'post:/api/slow-endpoint': {
  path: '/api/slow-endpoint',
  method: 'post',
  response: { message: 'Processed after delay' },
  delay: 2000, // 2 seconds delay
  statusCode: 200
}
```

#### Routes with Custom Headers

```typescript
'get:/api/custom': {
  path: '/api/custom',
  method: 'get',
  response: { data: 'custom response' },
  headers: {
    'X-Custom-Header': 'CustomValue',
    'Cache-Control': 'no-cache'
  }
}
```

## HTTP Methods Support

### Supported Methods
- `GET` - Data retrieval
- `POST` - Data creation
- `PUT` - Data replacement
- `PATCH` - Data update
- `DELETE` - Data deletion

### Example Routes for Each Method

```typescript
const routes = {
  // GET - Retrieve data
  'get:/api/users': {
    path: '/api/users',
    method: 'get',
    response: () => ({ users: mockUserList })
  },
  
  // POST - Create new resource
  'post:/api/users': {
    path: '/api/users',
    method: 'post',
    response: (req) => ({
      id: generateId(),
      ...req.body,
      createdAt: new Date().toISOString()
    }),
    statusCode: 201
  },
  
  // PUT - Update entire resource
  'put:/api/users/:id': {
    path: '/api/users/:id',
    method: 'put',
    response: (req) => ({
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    })
  },
  
  // PATCH - Partial update
  'patch:/api/users/:id': {
    path: '/api/users/:id',
    method: 'patch',
    response: (req) => ({
      id: req.params.id,
      ...existingUserData,
      ...req.body,
      updatedAt: new Date().toISOString()
    })
  },
  
  // DELETE - Remove resource
  'delete:/api/users/:id': {
    path: '/api/users/:id',
    method: 'delete',
    response: () => ({ message: 'User deleted successfully' }),
    statusCode: 204
  }
};
```

## CLI API

### Commands

#### `schemock start [schemaPath]`

Starts a mock server with optional schema file.

**Syntax:**
```bash
schemock start [schemaPath] [options]
```

**Options:**
- `-p, --port <number>` - Port to run the server on (default: 3000)
- `--no-cors` - Disable CORS
- `--log-level <level>` - Log level (error, warn, info, debug)

**Examples:**
```bash
# Start with default schema
schemock start

# Start with custom schema
schemock start ./schemas/user-schema.json

# Start on custom port with debug logging
schemock start ./schemas/api.json --port 8080 --log-level debug

# Start without CORS
schemock start ./schemas/private-api.json --no-cors
```

#### `schemock init [directory]`

Initializes a new mock server project.

**Syntax:**
```bash
schemock init [directory] [options]
```

**Options:**
- `--name <name>` - Project name (default: my-mock-server)
- `--port <port>` - Default port (default: 3000)

**Examples:**
```bash
# Initialize in current directory
schemock init

# Initialize in specific directory
schemock init ./my-mock-api

# Initialize with custom name and port
schemock init ./user-api --name user-mock-server --port 4000
```

## Configuration Options

### ServerOptions

```typescript
interface ServerOptions {
  port: number;                    // Server port (1-65535)
  basePath?: string;              // Base path for all routes
  watch?: boolean;                 // Watch for file changes (future)
  cors?: boolean;                  // Enable/disable CORS
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  scenario?: 'happy-path' | 'slow' | 'error-heavy' | 'sad-path';
}
```

### RouteConfig

```typescript
interface RouteConfig {
  path: string;                    // Route path
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  response: any;                   // Response data or function
  statusCode?: number;            // HTTP status code (default: 200)
  delay?: number;                 // Response delay in milliseconds
  headers?: Record<string, string>; // Custom response headers
}
```

## Schema Integration

### Supported Schema Features

#### Basic Types
```typescript
const basicTypesSchema = {
  type: 'object',
  properties: {
    stringProp: { type: 'string' },
    numberProp: { type: 'number', minimum: 0, maximum: 100 },
    intProp: { type: 'integer', multipleOf: 5 },
    boolProp: { type: 'boolean' },
    nullProp: { type: 'null' }
  }
};
```

#### String Formats
```typescript
const formatSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    website: { type: 'string', format: 'uri' },
    ipAddress: { type: 'string', format: 'ipv4' },
    timestamp: { type: 'string', format: 'date-time' }
  }
};
```

#### Arrays and Objects
```typescript
const complexSchema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 5
    },
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer', minimum: 0, maximum: 120 }
      },
      required: ['name']
    }
  }
};
```

#### Enum Values
```typescript
const enumSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'pending']
    },
    priority: {
      type: 'integer',
      enum: [1, 2, 3, 4, 5]
    }
  }
};
```

#### Schema Composition
```typescript
const compositionSchema = {
  oneOf: [
    { type: 'object', properties: { type: { const: 'user' } } },
    { type: 'object', properties: { type: { const: 'admin' } } }
  ]
};
```

## Error Responses

### 404 Not Found
When a route doesn't exist:

```json
{
  "error": "Not Found",
  "message": "No route found for GET /nonexistent"
}
```

### 500 Server Error
When an error occurs in route handling:

```json
{
  "error": "Internal Server Error",
  "message": "Error details..."
}
```

## Request Logging

Based on the configured log level, requests are logged in the following format:

```
[2023-12-01T10:30:00.000Z] GET /api/users
[2023-12-01T10:30:01.000Z] POST /api/data
[2023-12-01T10:30:02.000Z] PUT /api/users/123
```

Log levels:
- `error`: Only errors
- `warn`: Errors and warnings
- `info`: Errors, warnings, and info (default)
- `debug`: All requests and debug information

## CORS Configuration

When CORS is enabled (default), the following headers are added:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Custom CORS headers can be added through the Express application:

```typescript
const app = server.getApp();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://example.com');
  next();
});
```

## Integration Examples

### Express.js Integration

```typescript
import express from 'express';
import { ServerGenerator } from 'schemock';

const app = express();
const mockServer = new ServerGenerator({
  server: { port: 3001 },
  routes: {
    'get:/api/mock': {
      path: '/api/mock',
      method: 'get',
      response: { message: 'Mock response' }
    }
  }
});

// Add custom routes
app.get('/api/real', (req, res) => {
  res.json({ message: 'Real endpoint' });
});

// Use mock server routes
app.use(mockServer.getApp());

app.listen(3000);
```

### Testing Integration

```typescript
import request from 'supertest';
import { ServerGenerator } from 'schemock';

describe('API Tests', () => {
  const server = new ServerGenerator({
    server: { port: 3001 },
    routes: {
      'get:/api/test': {
        path: '/api/test',
        method: 'get',
        response: { message: 'test data' }
      }
    }
  });

  const app = server.getApp();

  test('GET /api/test returns test data', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.body).toEqual({ message: 'test data' });
  });
});
```

### TypeScript Usage

```typescript
import { createMockServer, ServerOptions, MockServerConfig } from 'schemock';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 120 }
  },
  required: ['id', 'name', 'email']
} as const;

const server = createMockServer<User>(userSchema, {
  port: 3000,
  cors: true,
  logLevel: 'debug'
});
```