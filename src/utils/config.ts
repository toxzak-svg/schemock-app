/**
 * Centralized configuration management with schema-based validation
 * Addresses issues 8.1 (Configuration Scattered) and 8.2 (No Configuration Validation)
 */

import { ConfigurationError } from '../errors';
import { log } from './logger';
import {
    DEFAULT_PORT,
    DEFAULT_LOG_LEVEL,
    DEFAULT_CORS_ENABLED,
    DEFAULT_SCENARIO,
    MIN_PORT,
    MAX_PORT,
    LOG_LEVELS,
    ERROR_MESSAGES
} from './constants';
import type {
    ServerOptions,
    RouteConfig,
    MockServerConfig,
    Scenario
} from '../types';

/**
 * Valid HTTP methods for routes
 */
const VALID_HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

/**
 * Valid scenarios
 */
const VALID_SCENARIOS: Scenario[] = ['happy-path', 'slow', 'error-heavy', 'sad-path'];

/**
 * Configuration validation error details
 */
interface ConfigValidationError {
    field: string;
    message: string;
    value?: unknown;
}

/**
 * Performs a safe merge operation to prevent prototype pollution
 *
 * Recursively merges source object into target object, skipping dangerous
 * prototype keys like __proto__, constructor, and prototype.
 *
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns The merged object
 */
export function safeMerge<T extends Record<string, unknown>>(
    target: T,
    source: Record<string, unknown>
): T {
    const result: Record<string, unknown> = { ...target };

    for (const key of Object.keys(source)) {
        // Skip dangerous prototype pollution keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            log.warn(`Skipping potentially dangerous key during merge: ${key}`, {
                module: 'config'
            });
            continue;
        }

        const sourceValue = source[key];
        const targetValue = target[key];

        // Recursively merge objects
        if (
            typeof sourceValue === 'object' &&
            sourceValue !== null &&
            !Array.isArray(sourceValue) &&
            typeof targetValue === 'object' &&
            targetValue !== null &&
            !Array.isArray(targetValue)
        ) {
            result[key] = safeMerge(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>
            );
        } else {
            result[key] = sourceValue;
        }
    }

    return result as T;
}

/**
 * Validates server options and applies defaults for missing values
 *
 * @param options - Partial server options to validate
 * @returns Validated server options with defaults applied
 * @throws {ConfigurationError} When validation fails
 */
export function validateServerOptions(options: Partial<ServerOptions>): ServerOptions {
    const errors: ConfigValidationError[] = [];

    // Validate port
    if (options.port !== undefined) {
        const port = options.port;
        if (typeof port !== 'number' || !Number.isInteger(port)) {
            errors.push({
                field: 'server.port',
                message: 'Port must be an integer',
                value: port
            });
        } else if (port < MIN_PORT || port > MAX_PORT) {
            errors.push({
                field: 'server.port',
                message: `Port must be between ${MIN_PORT} and ${MAX_PORT}`,
                value: port
            });
        }
    }

    // Validate basePath
    if (options.basePath !== undefined) {
        if (typeof options.basePath !== 'string') {
            errors.push({
                field: 'server.basePath',
                message: 'basePath must be a string',
                value: options.basePath
            });
        } else if (!options.basePath.startsWith('/')) {
            errors.push({
                field: 'server.basePath',
                message: 'basePath must start with /',
                value: options.basePath
            });
        }
    }

    // Validate resourceName
    if (options.resourceName !== undefined) {
        if (typeof options.resourceName !== 'string') {
            errors.push({
                field: 'server.resourceName',
                message: 'resourceName must be a string',
                value: options.resourceName
            });
        } else if (options.resourceName.length === 0) {
            errors.push({
                field: 'server.resourceName',
                message: 'resourceName cannot be empty',
                value: options.resourceName
            });
        }
    }

    // Validate watch
    if (options.watch !== undefined && typeof options.watch !== 'boolean') {
        errors.push({
            field: 'server.watch',
            message: 'watch must be a boolean',
            value: options.watch
        });
    }

    // Validate cors
    if (options.cors !== undefined && typeof options.cors !== 'boolean') {
        errors.push({
            field: 'server.cors',
            message: 'cors must be a boolean',
            value: options.cors
        });
    }

    // Validate logLevel
    if (options.logLevel !== undefined) {
        if (!LOG_LEVELS.includes(options.logLevel as any)) {
            errors.push({
                field: 'server.logLevel',
                message: `logLevel must be one of: ${LOG_LEVELS.join(', ')}`,
                value: options.logLevel
            });
        }
    }

    // Validate scenario
    if (options.scenario !== undefined) {
        if (!VALID_SCENARIOS.includes(options.scenario)) {
            errors.push({
                field: 'server.scenario',
                message: `scenario must be one of: ${VALID_SCENARIOS.join(', ')}`,
                value: options.scenario
            });
        }
    }

    // Validate strict
    if (options.strict !== undefined && typeof options.strict !== 'boolean') {
        errors.push({
            field: 'server.strict',
            message: 'strict must be a boolean',
            value: options.strict
        });
    }

    // Validate hideBranding
    if (options.hideBranding !== undefined && typeof options.hideBranding !== 'boolean') {
        errors.push({
            field: 'server.hideBranding',
            message: 'hideBranding must be a boolean',
            value: options.hideBranding
        });
    }

    if (errors.length > 0) {
        throw new ConfigurationError(
            'Server options validation failed',
            errors
        );
    }

    // Return validated options with defaults
    return {
        port: options.port ?? DEFAULT_PORT,
        basePath: options.basePath,
        resourceName: options.resourceName,
        watch: options.watch ?? false,
        cors: options.cors ?? DEFAULT_CORS_ENABLED,
        logLevel: options.logLevel ?? DEFAULT_LOG_LEVEL,
        scenario: options.scenario ?? DEFAULT_SCENARIO,
        strict: options.strict ?? false,
        hideBranding: options.hideBranding ?? false
    };
}

/**
 * Validates a single route configuration
 *
 * @param routeId - The unique identifier for the route
 * @param route - The route configuration to validate
 * @throws {ConfigurationError} When validation fails
 */
export function validateRouteConfig(routeId: string, route: RouteConfig): void {
    const errors: ConfigValidationError[] = [];

    // Validate path
    if (typeof route.path !== 'string' || route.path.length === 0) {
        errors.push({
            field: `routes.${routeId}.path`,
            message: 'Route path must be a non-empty string',
            value: route.path
        });
    } else if (!route.path.startsWith('/')) {
        errors.push({
            field: `routes.${routeId}.path`,
            message: 'Route path must start with /',
            value: route.path
        });
    }

    // Validate method - only validate if it's a known HTTP method type
    // This allows for future extensibility while still catching obvious errors
    if (typeof route.method !== 'string' || route.method.length === 0) {
        errors.push({
            field: `routes.${routeId}.method`,
            message: 'Route method must be a non-empty string',
            value: route.method
        });
    }

    // Validate statusCode
    if (route.statusCode !== undefined) {
        if (typeof route.statusCode !== 'number' || !Number.isInteger(route.statusCode)) {
            errors.push({
                field: `routes.${routeId}.statusCode`,
                message: 'statusCode must be an integer',
                value: route.statusCode
            });
        } else if (route.statusCode < 100 || route.statusCode > 599) {
            errors.push({
                field: `routes.${routeId}.statusCode`,
                message: 'statusCode must be between 100 and 599',
                value: route.statusCode
            });
        }
    }

    // Validate delay
    if (route.delay !== undefined) {
        if (typeof route.delay !== 'number' || !Number.isInteger(route.delay)) {
            errors.push({
                field: `routes.${routeId}.delay`,
                message: 'delay must be an integer',
                value: route.delay
            });
        } else if (route.delay < 0) {
            errors.push({
                field: `routes.${routeId}.delay`,
                message: 'delay must be non-negative',
                value: route.delay
            });
        }
    }

    // Validate headers
    if (route.headers !== undefined) {
        if (typeof route.headers !== 'object' || route.headers === null || Array.isArray(route.headers)) {
            errors.push({
                field: `routes.${routeId}.headers`,
                message: 'headers must be an object',
                value: route.headers
            });
        } else {
            for (const [key, value] of Object.entries(route.headers)) {
                if (typeof value !== 'string') {
                    errors.push({
                        field: `routes.${routeId}.headers.${key}`,
                        message: 'Header values must be strings',
                        value
                    });
                }
            }
        }
    }

    if (errors.length > 0) {
        throw new ConfigurationError(
            `Route configuration validation failed for route: ${routeId}`,
            errors
        );
    }
}

/**
 * Validates the complete mock server configuration
 *
 * Validates both server options and all route configurations.
 *
 * @param config - The mock server configuration to validate
 * @returns The validated configuration
 * @throws {ConfigurationError} When validation fails
 */
export function validateMockServerConfig(config: MockServerConfig): MockServerConfig {
    const errors: ConfigValidationError[] = [];

    // Validate server configuration
    try {
        validateServerOptions(config.server);
    } catch (error) {
        if (error instanceof ConfigurationError) {
            errors.push(...error.details);
        } else {
            throw error;
        }
    }

    // Validate routes
    if (!config.routes || typeof config.routes !== 'object') {
        errors.push({
            field: 'routes',
            message: 'routes must be an object',
            value: config.routes
        });
    } else {
        for (const [routeId, route] of Object.entries(config.routes)) {
            try {
                validateRouteConfig(routeId, route);
            } catch (error) {
                if (error instanceof ConfigurationError) {
                    errors.push(...error.details);
                } else {
                    throw error;
                }
            }
        }
    }

    if (errors.length > 0) {
        throw new ConfigurationError(
            'Mock server configuration validation failed',
            errors
        );
    }

    return config;
}

/**
 * Gets the default server options
 *
 * @returns The default server options with all default values
 */
export function getDefaultServerOptions(): ServerOptions {
    return {
        port: DEFAULT_PORT,
        cors: DEFAULT_CORS_ENABLED,
        logLevel: DEFAULT_LOG_LEVEL,
        scenario: DEFAULT_SCENARIO,
        watch: false,
        strict: false,
        hideBranding: false
    };
}

/**
 * Creates a validated configuration from partial options
 *
 * Validates server options and returns a complete configuration with defaults.
 *
 * @param partialConfig - Partial configuration options
 * @returns A complete, validated mock server configuration
 * @throws {ConfigurationError} When server options validation fails
 */
export function createConfig(partialConfig: Partial<MockServerConfig>): MockServerConfig {
    const server = validateServerOptions(partialConfig.server || {});
    const routes = partialConfig.routes || {};

    return {
        server,
        routes
    };
}

/**
 * Merges two configurations safely
 *
 * Merges the override configuration into the base configuration using
 * a safe merge operation to prevent prototype pollution.
 *
 * @param base - The base configuration to merge into
 * @param override - The override configuration to merge from
 * @returns The merged and validated configuration
 * @throws {ConfigurationError} When server options validation fails
 */
export function mergeConfigs(base: MockServerConfig, override: Partial<MockServerConfig>): MockServerConfig {
    const mergedServer = safeMerge(base.server, override.server || {});
    const mergedRoutes = safeMerge(base.routes, override.routes || {});

    return {
        server: validateServerOptions(mergedServer),
        routes: mergedRoutes
    };
}
