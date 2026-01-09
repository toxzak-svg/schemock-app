"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJSONValue = isJSONValue;
exports.isJSONObject = isJSONObject;
exports.isJSONArray = isJSONArray;
exports.isSchema = isSchema;
exports.isResponseHandler = isResponseHandler;
exports.isRouteResponse = isRouteResponse;
exports.isSchemaEnumValue = isSchemaEnumValue;
// Type guards for runtime type checking
/**
 * Type guard to check if a value is a valid JSONValue
 *
 * @param value - The value to check
 * @returns True if the value is a valid JSONValue (string, number, boolean, null, object, or array)
 */
function isJSONValue(value) {
    if (value === null || value === undefined) {
        return true;
    }
    const type = typeof value;
    return (type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        (type === 'object' && (Array.isArray(value) || isJSONObject(value))));
}
/**
 * Type guard to check if a value is a JSONObject
 *
 * @param value - The value to check
 * @returns True if the value is a plain object (not null and not an array)
 */
function isJSONObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Type guard to check if a value is a JSONArray
 *
 * @param value - The value to check
 * @returns True if the value is an array
 */
function isJSONArray(value) {
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
function isSchema(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const schema = value;
    // Check for common schema properties
    return ('$schema' in schema ||
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
        'required' in schema);
}
/**
 * Type guard to check if a value is a ResponseHandler function
 *
 * @param value - The value to check
 * @returns True if the value is a function
 */
function isResponseHandler(value) {
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
function isRouteResponse(value) {
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
function isSchemaEnumValue(value) {
    return (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean');
}
//# sourceMappingURL=index.js.map