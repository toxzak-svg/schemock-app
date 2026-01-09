export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = {
    [key: string]: JSONValue;
};
export type JSONArray = JSONValue[];
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
    [key: string]: unknown;
}
export interface RouteDefinition {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    response: JSONValue | Schema;
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
    hideBranding?: boolean;
    [key: string]: unknown;
}
export interface RouteRequest {
    params?: Record<string, string>;
    query?: Record<string, unknown>;
    body?: unknown;
    method?: string;
    path?: string;
    headers?: Record<string, string>;
}
export type ServerState = Record<string, JSONValue[]>;
export type ResponseHandler = (req: RouteRequest, state: ServerState) => JSONValue | Promise<JSONValue>;
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
/**
 * Type guard to check if a value is a valid JSONValue
 */
export declare function isJSONValue(value: unknown): value is JSONValue;
/**
 * Type guard to check if a value is a JSONObject
 */
export declare function isJSONObject(value: unknown): value is JSONObject;
/**
 * Type guard to check if a value is a JSONArray
 */
export declare function isJSONArray(value: unknown): value is JSONArray;
/**
 * Type guard to check if a value is a Schema
 */
export declare function isSchema(value: unknown): value is Schema;
/**
 * Type guard to check if a value is a ResponseHandler function
 */
export declare function isResponseHandler(value: unknown): value is ResponseHandler;
/**
 * Type guard to check if a value is a valid RouteResponse
 */
export declare function isRouteResponse(value: unknown): value is RouteResponse;
/**
 * Type guard to check if a value is a valid SchemaEnumValue
 */
export declare function isSchemaEnumValue(value: unknown): value is SchemaEnumValue;
