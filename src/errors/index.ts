/**
 * Custom error classes for Schemock
 */

/**
 * Base error class for all Schemock errors
 *
 * Extends the native Error class with additional properties for error codes,
 * details, and helpful hints.
 */
export class SchemockError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'SchemockError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration-related errors (E001-E099)
 *
 * Thrown when there are issues with CLI arguments or configuration files.
 */
export class ConfigurationError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E001', details, hint || 'Check your CLI arguments or configuration file.');
    this.name = 'ConfigurationError';
  }
}

/**
 * Schema parsing errors (E100-E199)
 *
 * Thrown when a JSON Schema cannot be parsed or is invalid.
 *
 * @param message - The error message
 * @param details - Additional error details
 * @param hint - Optional hint for resolving the error
 */
export class SchemaParseError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E100', details, hint || 'Ensure your schema follows JSON Schema Draft 7 specifications.');
    this.name = 'SchemaParseError';
  }
}

/**
 * Schema reference resolution errors (E101)
 *
 * Thrown when a $ref in a JSON Schema cannot be resolved.
 *
 * @param message - The error message
 * @param ref - The reference string that could not be resolved
 * @param hint - Optional hint for resolving the error
 */
export class SchemaRefError extends SchemockError {
  constructor(message: string, ref: string, hint?: string) {
    super(message, 'E101', { ref }, hint || 'Verify that the referenced definition exists in your schema.');
    this.name = 'SchemaRefError';
  }
}

/**
 * Server errors (E200-E299)
 *
 * Thrown when the mock server encounters issues starting or running.
 *
 * @param message - The error message
 * @param details - Additional error details
 * @param hint - Optional hint for resolving the error
 */
export class ServerError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E200', details, hint || 'Check if another process is using the same port or if you have necessary permissions.');
    this.name = 'ServerError';
  }
}

/**
 * Port-related errors (E201)
 *
 * Thrown when the specified port is already in use or invalid.
 *
 * @param message - The error message
 * @param port - The port number that caused the error
 * @param hint - Optional hint for resolving the error
 */
export class PortError extends SchemockError {
  constructor(message: string, port: number, hint?: string) {
    super(message, 'E201', { port }, hint || `Port ${port} is already in use. Try starting with a different port using --port <number>.`);
    this.name = 'PortError';
  }
}

/**
 * File I/O errors (E300-E399)
 *
 * Thrown when file operations fail due to missing files or permission issues.
 *
 * @param message - The error message
 * @param filePath - The path to the file that caused the error
 * @param operation - The file operation being performed
 * @param hint - Optional hint for resolving the error
 */
export class FileError extends SchemockError {
  constructor(message: string, filePath: string, operation?: string, hint?: string) {
    super(message, 'E300', { filePath, operation }, hint || `Make sure the file at ${filePath} exists and is readable.`);
    this.name = 'FileError';
  }
}

/**
 * Validation errors (E400-E499)
 *
 * Thrown when data or configuration fails validation against a schema.
 *
 * @param message - The error message
 * @param field - The field that failed validation
 * @param value - The value that failed validation
 * @param hint - Optional hint for resolving the error
 */
export class ValidationError extends SchemockError {
  constructor(message: string, field: string, value?: any, hint?: string) {
    super(message, 'E400', { field, value }, hint || `The provided value for '${field}' does not match the schema requirements.`);
    this.name = 'ValidationError';
  }
}

/**
 * Formats an error message for display
 *
 * Includes error code, message, hint, and details for SchemockError instances.
 *
 * @param error - The error to format
 * @returns A formatted error message string
 */
export function formatError(error: Error): string {
  if (error instanceof SchemockError) {
    let message = `[${error.code}] ${error.message}`;

    if (error.hint) {
      message += `\n\n💡 Hint: ${error.hint}`;
    }

    if (error.details && Object.keys(error.details).length > 0) {
      message += `\n\nDetails:\n${JSON.stringify(error.details, null, 2)}`;
    }

    // Legacy suggestions (kept for backward compatibility or more specific advice)
    if (error instanceof PortError && error.details.port) {
      message += `\n\nAdditional Suggestions:
- On Windows: netstat -ano | findstr :${error.details.port}
- On macOS/Linux: lsof -i :${error.details.port}`;
    }

    return message;
  }

  return error.message;
}
