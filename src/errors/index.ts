/**
 * Custom error classes for Schemock
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
 */
export class ConfigurationError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E001', details, hint || 'Check your CLI arguments or configuration file.');
    this.name = 'ConfigurationError';
  }
}

/**
 * Schema parsing errors (E100-E199)
 */
export class SchemaParseError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E100', details, hint || 'Ensure your schema follows JSON Schema Draft 7 specifications.');
    this.name = 'SchemaParseError';
  }
}

/**
 * Schema reference resolution errors (E101)
 */
export class SchemaRefError extends SchemockError {
  constructor(message: string, ref: string, hint?: string) {
    super(message, 'E101', { ref }, hint || 'Verify that the referenced definition exists in your schema.');
    this.name = 'SchemaRefError';
  }
}

/**
 * Server errors (E200-E299)
 */
export class ServerError extends SchemockError {
  constructor(message: string, details?: any, hint?: string) {
    super(message, 'E200', details, hint || 'Check if another process is using the same port or if you have necessary permissions.');
    this.name = 'ServerError';
  }
}

/**
 * Port-related errors (E201)
 */
export class PortError extends SchemockError {
  constructor(message: string, port: number, hint?: string) {
    super(message, 'E201', { port }, hint || `Port ${port} is already in use. Try starting with a different port using --port <number>.`);
    this.name = 'PortError';
  }
}

/**
 * File I/O errors (E300-E399)
 */
export class FileError extends SchemockError {
  constructor(message: string, filePath: string, operation?: string, hint?: string) {
    super(message, 'E300', { filePath, operation }, hint || `Make sure the file at ${filePath} exists and is readable.`);
    this.name = 'FileError';
  }
}

/**
 * Validation errors (E400-E499)
 */
export class ValidationError extends SchemockError {
  constructor(message: string, field: string, value?: any, hint?: string) {
    super(message, 'E400', { field, value }, hint || `The provided value for '${field}' does not match the schema requirements.`);
    this.name = 'ValidationError';
  }
}

/**
 * Format error message for display
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
