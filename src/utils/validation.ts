/**
 * Validation and sanitization utilities
 */

import { resolve, normalize, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { ValidationError, FileError } from '../errors';

/**
 * Validate and sanitize a port number
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
  
  if (portNum < 1 || portNum > 65535) {
    throw new ValidationError(
      'Port must be between 1 and 65535',
      'port',
      portNum
    );
  }
  
  // Warn about privileged ports
  if (portNum < 1024 && process.platform !== 'win32') {
    console.warn(`Warning: Port ${portNum} requires elevated privileges on Unix-like systems`);
  }
  
  return portNum;
}

/**
 * Validate and sanitize a file path to prevent directory traversal
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
  const dangerousPatterns = [
    '..',           // Directory traversal
    '~',            // Home directory
    '$',            // Environment variables
    '%',            // URL encoding
    '\\\\?\\',      // Windows UNC paths
    'file://',      // File URIs
    '__proto__',    // Prototype pollution
    'constructor',  // Prototype pollution
    'prototype',    // Prototype pollution
  ];
  
  for (const pattern of dangerousPatterns) {
    if (filePath.includes(pattern)) {
      throw new ValidationError(
        `File path contains disallowed pattern: ${pattern}`,
        'filePath',
        filePath
      );
    }
  }
  
  // Check for executable file extensions (security risk)
  const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.sh', '.bash'];
  const lowerPath = filePath.toLowerCase();
  for (const ext of executableExtensions) {
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
 * Validate that a file exists and is readable
 */
export function validateFileExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new FileError(`File not found: ${filePath}`, filePath, 'read');
  }
}

/**
 * Validate JSON Schema structure
 */
export function validateSchema(schema: any, strict: boolean = false): void {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new ValidationError(
      'Schema must be a valid object',
      'schema',
      schema,
      'Check if your JSON file contains a single root object { ... }.'
    );
  }
  
  // Basic schema validation - require type or composition keywords
  if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
    throw new ValidationError(
      'Schema must have a type or composition keyword (oneOf, anyOf, allOf, $ref)',
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
          `Invalid schema type: ${type}. Must be one of: ${validTypes.join(', ')}`,
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
 * Validate data against a JSON Schema
 */
export function validateData(data: any, schema: any): void {
  if (!schema) return;

  // Simple validation for required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (data[field] === undefined) {
        throw new ValidationError(`Missing required field: ${field}`, field);
      }
    }
  }

  // Type validation
  if (schema.type === 'string' && typeof data !== 'string') {
    throw new ValidationError(`Expected string, got ${typeof data}`, 'type');
  }
  if ((schema.type === 'number' || schema.type === 'integer') && typeof data !== 'number') {
    throw new ValidationError(`Expected number, got ${typeof data}`, 'type');
  }
  if (schema.type === 'boolean' && typeof data !== 'boolean') {
    throw new ValidationError(`Expected boolean, got ${typeof data}`, 'type');
  }
  if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
    throw new ValidationError(`Expected object, got ${typeof data}`, 'type');
  }
  if (schema.type === 'array' && !Array.isArray(data)) {
    throw new ValidationError(`Expected array, got ${typeof data}`, 'type');
  }

  // String constraints
  if (typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      throw new ValidationError(`String too short (min: ${schema.minLength})`, 'minLength', data.length);
    }
    if (schema.maxLength && data.length > schema.maxLength) {
      throw new ValidationError(`String too long (max: ${schema.maxLength})`, 'maxLength', data.length);
    }
  }

  // Number constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      throw new ValidationError(`Number too small (min: ${schema.minimum})`, 'minimum', data);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      throw new ValidationError(`Number too large (max: ${schema.maximum})`, 'maximum', data);
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
 * Validate log level
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
 * Sanitize string input to prevent injection
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
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
 * Validate project name for init command
 */
export function validateProjectName(name: string): string {
  const sanitized = sanitizeString(name, 100);
  
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
