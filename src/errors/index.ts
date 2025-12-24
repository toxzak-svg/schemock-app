/**
 * Custom error classes for Schemock
 */

export class SchemockError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
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
  constructor(message: string, details?: any) {
    super(message, 'E001', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Schema parsing errors (E100-E199)
 */
export class SchemaParseError extends SchemockError {
  constructor(message: string, details?: any) {
    super(message, 'E100', details);
    this.name = 'SchemaParseError';
  }
}

/**
 * Schema reference resolution errors (E101)
 */
export class SchemaRefError extends SchemockError {
  constructor(message: string, ref: string) {
    super(message, 'E101', { ref });
    this.name = 'SchemaRefError';
  }
}

/**
 * Server errors (E200-E299)
 */
export class ServerError extends SchemockError {
  constructor(message: string, details?: any) {
    super(message, 'E200', details);
    this.name = 'ServerError';
  }
}

/**
 * Port-related errors (E201)
 */
export class PortError extends SchemockError {
  constructor(message: string, port: number) {
    super(message, 'E201', { port });
    this.name = 'PortError';
  }
}

/**
 * File I/O errors (E300-E399)
 */
export class FileError extends SchemockError {
  constructor(message: string, filePath: string, operation?: string) {
    super(message, 'E300', { filePath, operation });
    this.name = 'FileError';
  }
}

/**
 * Validation errors (E400-E499)
 */
export class ValidationError extends SchemockError {
  constructor(message: string, field: string, value?: any) {
    super(message, 'E400', { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Format error message for display
 */
export function formatError(error: Error): string {
  if (error instanceof SchemockError) {
    let message = `[${error.code}] ${error.message}`;
    
    if (error.details) {
      message += `\n\nDetails:\n${JSON.stringify(error.details, null, 2)}`;
    }
    
    // Add helpful suggestions based on error type
    if (error instanceof PortError) {
      message += `\n\nSuggestions:
- Try a different port: schemock start --port 3001
- Check if another process is using port ${error.details.port}
- On Windows: netstat -ano | findstr :${error.details.port}
- On macOS/Linux: lsof -i :${error.details.port}`;
    } else if (error instanceof FileError) {
      message += `\n\nSuggestions:
- Check if the file exists: ${error.details.filePath}
- Verify file permissions
- Ensure the path is correct`;
    } else if (error instanceof SchemaRefError) {
      message += `\n\nSuggestions:
- Check if the reference path is correct: ${error.details.ref}
- Ensure the referenced definition exists in the schema
- Verify the $ref format (e.g., "#/definitions/User")`;
    }
    
    return message;
  }
  
  return error.message;
}
