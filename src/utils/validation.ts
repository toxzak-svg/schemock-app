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
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  
  if (isNaN(portNum)) {
    throw new ValidationError('Port must be a valid number', 'port', port);
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
  
  // Resolve to absolute path
  const absolutePath = isAbsolute(filePath) 
    ? normalize(filePath)
    : resolve(process.cwd(), filePath);
  
  // Check for directory traversal attempts
  if (baseDir) {
    const normalizedBase = normalize(baseDir);
    if (!absolutePath.startsWith(normalizedBase)) {
      throw new ValidationError(
        'File path attempts to access files outside allowed directory',
        'filePath',
        filePath
      );
    }
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = ['..', '~', '$'];
  const normalizedPath = normalize(filePath);
  
  for (const pattern of suspiciousPatterns) {
    if (normalizedPath.includes(pattern)) {
      console.warn(`Warning: File path contains potentially unsafe pattern: ${pattern}`);
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
export function validateSchema(schema: any): void {
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError('Schema must be a valid object', 'schema', schema);
  }
  
  // Basic schema validation
  if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
    console.warn('Warning: Schema has no type or composition keywords. May not generate meaningful data.');
  }
  
  // Validate type if present
  if (schema.type) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    
    for (const type of types) {
      if (!validTypes.includes(type)) {
        throw new ValidationError(
          `Invalid schema type: ${type}. Must be one of: ${validTypes.join(', ')}`,
          'schema.type',
          type
        );
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
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate project name for init command
 */
export function validateProjectName(name: string): string {
  const sanitized = sanitizeString(name, 100);
  
  // Check for valid npm package name
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
