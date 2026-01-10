/**
 * Type definitions for the Schemocker MCP Server
 */

/**
 * Configuration options for the Schemocker MCP Server
 */
export interface SchemockerMCPConfig {
  /**
   * Base URL of the running Schemocker instance
   * @default 'http://localhost:3000'
   */
  baseUrl?: string;

  /**
   * Timeout for HTTP requests to Schemocker (in milliseconds)
   * @default 10000
   */
  timeout?: number;
}

/**
 * Route information extracted from Schemocker
 */
export interface RouteInfo {
  /**
   * HTTP method (GET, POST, PUT, DELETE, PATCH)
   */
  method: string;

  /**
   * The endpoint path
   */
  path: string;

  /**
   * Description of the route
   */
  description?: string;

  /**
   * Expected HTTP status code
   */
  statusCode?: number;

  /**
   * Delay in milliseconds before response
   */
  delay?: number;

  /**
   * Custom headers for the response
   */
  headers?: Record<string, string>;

  /**
   * Example response data (if requested)
   */
  exampleResponse?: unknown;

  /**
   * Request schema (for POST/PUT/PATCH)
   */
  request?: unknown;

  /**
   * Response schema
   */
  response?: unknown;
}

/**
 * Parameters for the list_routes tool
 */
export interface ListRoutesParams {
  /**
   * Whether to include example responses for each route
   * @default true
   */
  includeExamples?: boolean;
}

/**
 * Parameters for the call_endpoint tool
 */
export interface CallEndpointParams {
  /**
   * HTTP method to use
   */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /**
   * The endpoint path (e.g., /api/users)
   */
  path: string;

  /**
   * Request body for POST, PUT, PATCH requests
   */
  body?: Record<string, unknown>;

  /**
   * Query parameters as key-value pairs
   */
  query?: Record<string, unknown>;

  /**
   * Additional headers to include in the request
   */
  headers?: Record<string, string>;
}

/**
 * Parameters for the reload_schema tool
 */
export interface ReloadSchemaParams {
  /**
   * Optional path to the schema file to reload
   */
  schemaPath?: string;
}

/**
 * Response from calling a Schemocker endpoint
 */
export interface EndpointResponse {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * HTTP status text
   */
  statusText: string;

  /**
   * Response headers
   */
  headers: Record<string, string>;

  /**
   * Response body data
   */
  data: unknown;
}

/**
 * Result of a schema reload operation
 */
export interface ReloadSchemaResult {
  /**
   * Whether the reload was successful
   */
  success: boolean;

  /**
   * Message describing the result
   */
  message: string;

  /**
   * Timestamp of the reload operation
   */
  timestamp: string;
}
