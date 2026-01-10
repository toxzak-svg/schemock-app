# Schemocker MCP Server

The Schemocker MCP (Model Context Protocol) server enables AI assistants to interact with running Schemocker instances through a standardized protocol. This allows AI models to discover available API endpoints, make requests, and reload schemas programmatically.

## Overview

The MCP server provides three core tools:

1. **`list_routes`** - Discover all available routes/endpoints from the Schemocker mock server
2. **`call_endpoint`** - Make HTTP requests to Schemocker endpoints and receive JSON responses
3. **`reload_schema`** - Trigger a schema reload to pick up schema changes

## Installation

### Prerequisites

- Node.js 18 or higher
- A running Schemocker instance
- MCP-compatible AI client (e.g., Claude Desktop, Cursor, etc.)

### Install Dependencies

```bash
npm install
```

### Build the MCP Server

```bash
npm run build
```

## Configuration

### Environment Variables

The MCP server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SCHEMOCKER_BASE_URL` | Base URL of the running Schemocker instance | `http://localhost:3000` |

### MCP Client Configuration

Add the Schemocker MCP server to your MCP client's configuration file (typically `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "schemocker": {
      "command": "node",
      "args": [
        "/path/to/schemocker/dist/mcp-server/index.js"
      ],
      "env": {
        "SCHEMOCKER_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Usage

### Starting Schemocker

First, start a Schemocker instance with your schema:

```bash
# Using the CLI
schemocker start --schema examples/simple-user.json --port 3000

# Or programmatically
npm run dev
```

### Running the MCP Server

The MCP server runs as a stdio-based process, which is automatically managed by your MCP client. You can also run it manually for testing:

```bash
npm run mcp
```

For development with auto-reload:

```bash
npm run mcp:dev
```

## Available Tools

### 1. list_routes

Lists all available routes/endpoints from the Schemocker mock server, including paths, methods, and example payload shapes.

**Parameters:**
- `includeExamples` (boolean, optional): Whether to include example responses for each route. Default: `true`

**Example:**

```json
{
  "name": "list_routes",
  "arguments": {
    "includeExamples": true
  }
}
```

**Response:**

```json
[
  {
    "method": "GET",
    "path": "/api/users",
    "description": "List all user items",
    "exampleResponse": {
      "data": [
        { "id": "uuid", "name": "John Doe", "email": "john@example.com" }
      ]
    }
  },
  {
    "method": "POST",
    "path": "/api/users",
    "description": "Create a new user",
    "exampleResponse": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
]
```

### 2. call_endpoint

Makes an HTTP request to a Schemocker endpoint and returns the JSON response.

**Parameters:**
- `method` (string, required): HTTP method - `GET`, `POST`, `PUT`, `DELETE`, or `PATCH`
- `path` (string, required): The endpoint path (e.g., `/api/users`)
- `body` (object, optional): Request body for POST, PUT, PATCH requests
- `query` (object, optional): Query parameters as key-value pairs
- `headers` (object, optional): Additional headers to include in the request

**Example:**

```json
{
  "name": "call_endpoint",
  "arguments": {
    "method": "GET",
    "path": "/api/users",
    "query": {
      "limit": 10,
      "offset": 0
    }
  }
}
```

**POST Example:**

```json
{
  "name": "call_endpoint",
  "arguments": {
    "method": "POST",
    "path": "/api/users",
    "body": {
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "age": 28
    }
  }
}
```

**Response:**

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28,
    "createdAt": "2024-01-10T13:47:36.691Z"
  }
}
```

### 3. reload_schema

Triggers a schema reload on the Schemocker server to pick up schema changes.

**Parameters:**
- `schemaPath` (string, optional): Path to the schema file to reload (if not using the default schema)

**Example:**

```json
{
  "name": "reload_schema",
  "arguments": {
    "schemaPath": "./examples/updated-schema.json"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Schema reloaded successfully",
  "timestamp": "2024-01-10T13:47:36.691Z"
}
```

## How It Works

### Architecture

```
┌─────────────────┐     MCP Protocol     ┌──────────────────┐
│   AI Assistant  │ ◄──────────────────► │  MCP Server      │
│  (Claude/Cursor)│  (stdio/stdout)      │  (schemocker)    │
└─────────────────┘                       └────────┬─────────┘
                                                   │
                                                   │ HTTP
                                                   │
┌─────────────────┐                               │
│  Schemocker     │ ◄─────────────────────────────┘
│  Mock Server    │   (http://localhost:3000)
│  (port 3000)    │
└─────────────────┘
```

### Tool Flow

1. **Discovery**: The AI assistant uses `list_routes` to discover available endpoints
2. **Interaction**: The AI uses `call_endpoint` to make requests and see realistic responses
3. **Iteration**: After schema changes, the AI uses `reload_schema` to pick up new endpoints

### Route Discovery

The MCP server can discover routes in two ways:

1. **From Schemocker's internal routes endpoint** (`/__schemock/routes`)
2. **By parsing the JSON Schema** and generating CRUD routes

If the routes endpoint is not available, the server falls back to schema-based route discovery.

## Example Use Cases

### 1. Frontend Code Generation

An AI assistant can:
1. Use `list_routes` to discover all API endpoints
2. Use `call_endpoint` to see example responses
3. Generate TypeScript interfaces and frontend code that matches the API

### 2. API Testing

An AI assistant can:
1. Discover available endpoints
2. Generate test cases with various payloads
3. Call endpoints and validate responses
4. Test error scenarios

### 3. Documentation Generation

An AI assistant can:
1. List all routes with examples
2. Generate API documentation in Markdown or OpenAPI format
3. Create usage examples for each endpoint

### 4. Schema Iteration

When developing a new API:
1. Start with a basic schema
2. Have the AI explore endpoints via MCP tools
3. Update the schema
4. Use `reload_schema` to pick up changes
5. Continue iteration

## Troubleshooting

### Connection Issues

If the MCP server cannot connect to Schemocker:

1. Verify Schemocker is running:
   ```bash
   curl http://localhost:3000/__schemock/health
   ```

2. Check the base URL in your MCP configuration:
   ```json
   "env": {
     "SCHEMOCKER_BASE_URL": "http://localhost:3000"
   }
   ```

3. Ensure Schemocker is accessible from the MCP server's network

### Tool Errors

**"Failed to list routes"**
- Ensure Schemocker is running
- Check that the base URL is correct
- Verify Schemocker has routes configured

**"Failed to call endpoint"**
- Verify the endpoint path is correct
- Check that the HTTP method is supported
- Ensure required parameters are provided

**"Failed to reload schema"**
- The reload endpoint may not be available in your Schemocker version
- Ensure the schema file path is correct (if provided)

### Debug Mode

To enable debug logging, set the log level in your Schemocker configuration:

```json
{
  "server": {
    "port": 3000,
    "logLevel": "debug"
  }
}
```

## Development

### Project Structure

```
src/mcp-server/
├── index.ts          # Main MCP server implementation
├── types.ts          # TypeScript type definitions
└── README.md         # This file
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

The compiled MCP server will be available at `dist/mcp-server/index.js`.

## License

MIT License - See the main [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines.

## Support

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/toxzak-svg/schemock-app/issues).
