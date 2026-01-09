/**
 * Validation and sanitization utilities
 */

import { resolve, normalize, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { ValidationError, FileError } from '../errors';
import { log } from './logger';
import {
  MIN_PORT,
  MAX_PORT,
  PRIVILEGED_PORT_THRESHOLD,
  DEFAULT_MAX_LOG_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  ERROR_MESSAGES,
  DANGEROUS_PATH_PATTERNS,
  EXECUTABLE_EXTENSIONS
} from './constants';

/**
 * Validates and sanitizes a port number
 *
 * @param port - The port number to validate (string or number)
 * @returns The validated port as an integer
 * @throws {ValidationError} When the port is invalid
 */
export function validatePort(port: string | number): number {
  // Reject non-numeric types
  if (typeof port !== 'string' && typeof port !== 'number') {
    throw new ValidationError('Port must be a string or number', 'port', typeof port);
  }

  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

  if (isNaN(portNum) || !isFinite(portNum)) {
    throw new ValidationError('Port must be a valid number', 'port', port);
  }

  // Reject floating point numbers
  if (!Number.isInteger(portNum)) {
    throw new ValidationError('Port must be an integer', 'port', port);
  }

  if (portNum < MIN_PORT || portNum > MAX_PORT) {
    throw new ValidationError(
      `Port must be between ${MIN_PORT} and ${MAX_PORT}`,
      'port',
      portNum
    );
  }

  // Warn about privileged ports using proper error handling
  if (portNum < PRIVILEGED_PORT_THRESHOLD && process.platform !== 'win32') {
    log.warn(`${ERROR_MESSAGES.PORT_REQUIRES_ELEVATED_PRIVILEGES}: ${portNum}`, {
      module: 'validation',
      port: portNum,
      platform: process.platform
    });
  }

  return portNum;
}

/**
 * Validates and sanitizes a file path to prevent directory traversal attacks
 *
 * Checks for dangerous patterns, executable extensions, and ensures the path
 * is within the allowed base directory if specified.
 *
 * @param filePath - The file path to validate
 * @param baseDir - Optional base directory to restrict the path to
 * @returns The normalized absolute file path
 * @throws {ValidationError} When the path is invalid or contains dangerous patterns
 */
export function validateFilePath(filePath: string, baseDir?: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string', 'filePath', filePath);
  }

  // Remove null bytes (potential injection)
  if (filePath.includes('\0')) {
    throw new ValidationError('File path contains invalid null bytes', 'filePath', filePath);
  }

  // Reject absolute paths for security
  if (isAbsolute(filePath)) {
    throw new ValidationError(
      'Absolute paths are not allowed for security reasons',
      'filePath',
      filePath
    );
  }

  // Check for dangerous patterns BEFORE normalization
  for (const pattern of DANGEROUS_PATH_PATTERNS) {
    if (filePath.includes(pattern)) {
      throw new ValidationError(
        `File path contains disallowed pattern: ${pattern}`,
        'filePath',
        filePath
      );
    }
  }

  // Check for executable file extensions (security risk)
  const lowerPath = filePath.toLowerCase();
  for (const ext of EXECUTABLE_EXTENSIONS) {
    if (lowerPath.endsWith(ext) || lowerPath.includes(ext + '.')) {
      throw new ValidationError(
        `File path contains executable extension: ${ext}`,
        'filePath',
        filePath
      );
    }
  }

  // Normalize and resolve to absolute path
  const absolutePath = resolve(process.cwd(), filePath);

  // If baseDir specified, ensure path is within it
  if (baseDir) {
    const normalizedBase = normalize(resolve(baseDir));
    if (!absolutePath.startsWith(normalizedBase)) {
      throw new ValidationError(
        'File path attempts to access files outside allowed directory',
        'filePath',
        filePath
      );
    }
  }

  return absolutePath;
}

/**
 * Validates that a file exists and is readable
 *
 * @param filePath - The absolute path to the file
 * @throws {FileError} When the file does not exist
 */
export function validateFileExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new FileError(`${ERROR_MESSAGES.FILE_NOT_FOUND}: ${filePath}`, filePath, 'read');
  }
}

/**
 * Validates a JSON Schema structure
 *
 * Checks that the schema is a valid object with appropriate type or composition
 * keywords. In strict mode, enforces additional validation rules.
 *
 * @param schema - The JSON Schema to validate
 * @param strict - Whether to apply strict validation rules
 * @throws {ValidationError} When the schema structure is invalid
 */
export function validateSchema(schema: any, strict: boolean = false): void {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new ValidationError(
      ERROR_MESSAGES.SCHEMA_MUST_BE_OBJECT,
      'schema',
      schema,
      'Check if your JSON file contains a single root object { ... }.'
    );
  }

  // Basic schema validation - require type or composition keywords
  if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
    throw new ValidationError(
      ERROR_MESSAGES.SCHEMA_MUST_HAVE_TYPE_OR_COMPOSITION,
      'schema',
      schema,
      'Add "type": "object" or similar to your root schema.'
    );
  }

  // Validate type if present
  if (schema.type) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];

    for (const type of types) {
      if (!validTypes.includes(type)) {
        throw new ValidationError(
          `${ERROR_MESSAGES.INVALID_SCHEMA_TYPE}: ${type}. Must be one of: ${validTypes.join(', ')}`,
          'type',
          type
        );
      }
    }
  }

  // Strict mode checks
  if (strict) {
    if (schema.type === 'object' && !schema.properties && !schema.additionalProperties && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
      throw new ValidationError(
        'Strict mode: object schema must define properties or additionalProperties',
        'properties',
        undefined,
        'In strict mode, objects must explicitly list their allowed properties.'
      );
    }

    if (schema.type === 'array' && !schema.items) {
      throw new ValidationError(
        'Strict mode: array schema must define items',
        'items',
        undefined,
        'In strict mode, arrays must define what kind of items they contain.'
      );
    }
  }

  // Recursively validate properties if they exist
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [prop, propSchema] of Object.entries(schema.properties)) {
      try {
        validateSchema(propSchema, strict);
      } catch (error: any) {
        if (error instanceof ValidationError) {
          throw new ValidationError(error.message, `properties.${prop}${error.details.field !== 'schema' ? '.' + error.details.field : ''}`, error.details.value);
        }
        throw error;
      }
    }
  }
}

/**
 * Validates data against a JSON Schema
 *
 * Performs type checking, constraint validation, and recursive validation
 * for nested objects and arrays.
 *
 * @param data - The data to validate
 * @param schema - The JSON Schema to validate against
 * @throws {ValidationError} When the data does not match the schema
 */
export function validateData(data: any, schema: any): void {
  if (!schema) return;

  // Simple validation for required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (data[field] === undefined) {
        throw new ValidationError(
          `${ERROR_MESSAGES.MISSING_REQUIRED_FIELD}: ${field}`,
          field,
          undefined,
          `Field '${field}' is required in schema but was not provided in data.`
        );
      }
    }
  }

  // Type validation
  if (schema.type === 'string' && typeof data !== 'string') {
    throw new ValidationError(
      `${ERROR_MESSAGES.EXPECTED_STRING}, got ${typeof data}`,
      'type',
      data,
      `Field value '${JSON.stringify(data)}' does not match expected type 'string'.`
    );
  }
  if ((schema.type === 'number' || schema.type === 'integer') && typeof data !== 'number') {
    throw new ValidationError(
      `${ERROR_MESSAGES.EXPECTED_NUMBER}, got ${typeof data}`,
      'type',
      data,
      `Field value '${JSON.stringify(data)}' does not match expected type '${schema.type}'.`
    );
  }
  if (schema.type === 'boolean' && typeof data !== 'boolean') {
    throw new ValidationError(
      `${ERROR_MESSAGES.EXPECTED_BOOLEAN}, got ${typeof data}`,
      'type',
      data,
      `Field value '${JSON.stringify(data)}' does not match expected type 'boolean'.`
    );
  }
  if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
    throw new ValidationError(
      `${ERROR_MESSAGES.EXPECTED_OBJECT}, got ${typeof data}`,
      'type',
      data,
      `Field value '${JSON.stringify(data)}' does not match expected type 'object'.`
    );
  }
  if (schema.type === 'array' && !Array.isArray(data)) {
    throw new ValidationError(
      `${ERROR_MESSAGES.EXPECTED_ARRAY}, got ${typeof data}`,
      'type',
      data,
      `Field value '${JSON.stringify(data)}' does not match expected type 'array'.`
    );
  }

  // String constraints
  if (typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      throw new ValidationError(
        `${ERROR_MESSAGES.STRING_TOO_SHORT} (min: ${schema.minLength}, actual: ${data.length})`,
        'minLength',
        data.length,
        `String value '${data}' must be at least ${schema.minLength} characters long.`
      );
    }
    if (schema.maxLength && data.length > schema.maxLength) {
      throw new ValidationError(
        `${ERROR_MESSAGES.STRING_TOO_LONG} (max: ${schema.maxLength}, actual: ${data.length})`,
        'maxLength',
        data.length,
        `String value '${data}' must be at most ${schema.maxLength} characters long.`
      );
    }
  }

  // Number constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      throw new ValidationError(
        `${ERROR_MESSAGES.NUMBER_TOO_SMALL} (min: ${schema.minimum}, actual: ${data})`,
        'minimum',
        data,
        `Number value ${data} must be at least ${schema.minimum}.`
      );
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      throw new ValidationError(
        `${ERROR_MESSAGES.NUMBER_TOO_LARGE} (max: ${schema.maximum}, actual: ${data})`,
        'maximum',
        data,
        `Number value ${data} must be at most ${schema.maximum}.`
      );
    }
  }

  // Recursive validation for objects
  if (schema.type === 'object' && schema.properties && data) {
    for (const [prop, propSchema] of Object.entries(schema.properties)) {
      if (data[prop] !== undefined) {
        try {
          validateData(data[prop], propSchema);
        } catch (error: any) {
          if (error instanceof ValidationError) {
            throw new ValidationError(error.message, `${prop}.${error.details.field}`, error.details.value);
          }
          throw error;
        }
      }
    }
  }
}

/**
 * Validates a log level string
 *
 * @param level - The log level to validate
 * @returns The validated log level
 * @throws {ValidationError} When the log level is invalid
 */
export function validateLogLevel(level: string): 'error' | 'warn' | 'info' | 'debug' {
  const validLevels = ['error', 'warn', 'info', 'debug'] as const;

  if (!validLevels.includes(level as any)) {
    throw new ValidationError(
      `Invalid log level: ${level}. Must be one of: ${validLevels.join(', ')}`,
      'logLevel',
      level
    );
  }

  return level as 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Sanitizes a string input to prevent injection attacks
 *
 * Removes control characters and shell injection characters, and limits
 * the length to prevent denial of service attacks.
 *
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length for the string
 * @returns The sanitized string
 * @throws {ValidationError} When the input is not a string or exceeds max length
 */
export function sanitizeString(input: string, maxLength: number = DEFAULT_MAX_LOG_LENGTH): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string', 'input', typeof input);
  }

  // Limit length to prevent DOS
  if (input.length > maxLength) {
    throw new ValidationError(
      `Input too long. Maximum ${maxLength} characters allowed.`,
      'input.length',
      input.length
    );
  }

  // Remove control characters except newlines and tabs
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove shell injection characters
  sanitized = sanitized.replace(/[|`$;&]/g, '');

  return sanitized;
}

/**
 * Validates a project name for the init command
 *
 * Ensures the name follows npm package naming conventions and is not
 * a reserved name.
 *
 * @param name - The project name to validate
 * @returns The sanitized project name
 * @throws {ValidationError} When the project name is invalid or reserved
 */
export function validateProjectName(name: string): string {
  const sanitized = sanitizeString(name, MAX_PROJECT_NAME_LENGTH);

  // Check for valid npm package name (allow lowercase, digits, hyphens, underscores)
  // More permissive to match common npm naming conventions
  const validNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!validNamePattern.test(sanitized)) {
    throw new ValidationError(
      'Project name must start with lowercase letter or digit, contain only lowercase letters, digits, and hyphens, and not end with a hyphen',
      'projectName',
      name
    );
  }

  // Check for reserved npm names
  const reserved = ['node_modules', 'favicon.ico'];
  if (reserved.includes(sanitized)) {
    throw new ValidationError(
      `Project name "${sanitized}" is reserved and cannot be used`,
      'projectName',
      sanitized
    );
  }

  return sanitized;
}
