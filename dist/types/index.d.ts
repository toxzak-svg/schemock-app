export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
export interface Schema {
    $schema?: string;
    $ref?: string;
    title?: string;
    description?: string;
    type?: JSONSchemaType | JSONSchemaType[];
    properties?: Record<string, Schema>;
    items?: Schema | Schema[];
    required?: string[];
    enum?: any[];
    default?: any;
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
    const?: any;
    [key: string]: any;
}
export interface ServerOptions {
    port: number;
    basePath?: string;
    watch?: boolean;
    cors?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
export interface RouteConfig {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    response: any;
    statusCode?: number;
    delay?: number;
    headers?: Record<string, string>;
}
export interface MockServerConfig {
    server: ServerOptions;
    routes: Record<string, RouteConfig>;
}
