export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// Non-null JSON value type for cases where null is not expected
export type NonNullJSONValue = string | number | boolean | JSONObject | JSONArray;

export type SchemaEnumValue = string | number | boolean | null;

export interface Schema {
  $schema?: string;
  $ref?: string;
  title?: string;
  description?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, Schema>;
  items?: Schema | Schema[];
  required?: string[];
  enum?: SchemaEnumValue[];
  default?: JSONValue;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  additionalProperties?: boolean | Schema;
  oneOf?: Schema[];
  anyOf?: Schema[];
  allOf?: Schema[];
  not?: Schema;
  const?: JSONValue;
  'x-schemock-routes'?: RouteDefinition[];
  [key: string]: unknown; // Allow for additional properties (extension points)
}

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  response: JSONValue | Schema; // Can be a fixed JSON value or a Schema to be parsed
  statusCode?: number;
  delay?: number;
  headers?: Record<string, string>;
}

export type Scenario = 'happy-path' | 'slow' | 'error-heavy' | 'sad-path';

export interface ServerOptions {
  port: number;
  basePath?: string;
  resourceName?: string;
  watch?: boolean;
  cors?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  scenario?: Scenario;
  strict?: boolean;
  hideBranding?: boolean; // Disable Schemock branding (for paid users)
  [key: string]: unknown; // Allow for additional properties (extension points)
}

// Type for request object (minimal interface, actual implementation uses Express Request)
export interface RouteRequest {
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: unknown;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
}

// Type for server state
export type ServerState = Record<string, JSONValue[]>;

// Response handler function type
export type ResponseHandler = (req: RouteRequest, state: ServerState) => JSONValue | Promise<JSONValue>;

// Response type: can be a static value, a Schema, or a handler function
export type RouteResponse = JSONValue | Schema | ResponseHandler;

export interface RouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  response: RouteResponse;
  statusCode?: number;
  delay?: number;
  headers?: Record<string, string>;
  schema?: Schema;
}

export interface MockServerConfig {
  server: ServerOptions;
  routes: Record<string, RouteConfig>;
}

// Type guards for runtime type checking

/**
 * Type guard to check if a value is a valid JSONValue
 *
 * @param value - The value to check
 * @returns True if the value is a valid JSONValue (string, number, boolean, null, object, or array)
 */
export function isJSONValue(value: unknown): value is JSONValue {
  if (value === null || value === undefined) {
    return true;
  }
  const type = typeof value;
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    (type === 'object' && (Array.isArray(value) || isJSONObject(value)))
  );
}

/**
 * Type guard to check if a value is a JSONObject
 *
 * @param value - The value to check
 * @returns True if the value is a plain object (not null and not an array)
 */
export function isJSONObject(value: unknown): value is JSONObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JSONArray
 *
 * @param value - The value to check
 * @returns True if the value is an array
 */
export function isJSONArray(value: unknown): value is JSONArray {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a Schema
 *
 * Checks if the value is an object with common JSON Schema properties.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a valid JSON Schema
 */
export function isSchema(value: unknown): value is Schema {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const schema = value as Record<string, unknown>;

  // Check for common schema properties
  return (
    '$schema' in schema ||
    '$ref' in schema ||
    'type' in schema ||
    'properties' in schema ||
    'items' in schema ||
    'oneOf' in schema ||
    'anyOf' in schema ||
    'allOf' in schema ||
    'not' in schema ||
    'enum' in schema ||
    'const' in schema ||
    'required' in schema
  );
}

/**
 * Type guard to check if a value is a ResponseHandler function
 *
 * @param value - The value to check
 * @returns True if the value is a function
 */
export function isResponseHandler(value: unknown): value is ResponseHandler {
  return typeof value === 'function';
}

/**
 * Type guard to check if a value is a valid RouteResponse
 *
 * A RouteResponse can be a JSONValue, Schema, or ResponseHandler function.
 *
 * @param value - The value to check
 * @returns True if the value is a valid RouteResponse type
 */
export function isRouteResponse(value: unknown): value is RouteResponse {
  return isJSONValue(value) || isSchema(value) || isResponseHandler(value);
}

/**
 * Type guard to check if a value is a valid SchemaEnumValue
 *
 * Schema enum values can be strings, numbers, booleans, or null.
 *
 * @param value - The value to check
 * @returns True if the value is a valid schema enum value
 */
export function isSchemaEnumValue(value: unknown): value is SchemaEnumValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
