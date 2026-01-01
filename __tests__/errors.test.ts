/**
 * Tests for error classes and error formatting
 */
import {
  SchemockError,
  ConfigurationError,
  SchemaParseError,
  SchemaRefError,
  ServerError,
  PortError,
  FileError,
  ValidationError,
  formatError
} from '../src/errors';

describe('Error Classes', () => {
  describe('SchemockError', () => {
    it('should create error with code and details', () => {
      const error = new SchemockError('Test error', 'E999', { key: 'value' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('E999');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('SchemockError');
    });

    it('should have proper stack trace', () => {
      const error = new SchemockError('Test error', 'E999');
      expect(error.stack).toBeDefined();
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.code).toBe('E001');
      expect(error.name).toBe('ConfigurationError');
      expect(error instanceof SchemockError).toBe(true);
    });
  });

  describe('SchemaParseError', () => {
    it('should create schema parse error', () => {
      const error = new SchemaParseError('Cannot parse schema');
      expect(error.code).toBe('E100');
      expect(error.name).toBe('SchemaParseError');
    });
  });

  describe('SchemaRefError', () => {
    it('should create schema ref error with ref in details', () => {
      const error = new SchemaRefError('Cannot resolve ref', '#/definitions/User');
      expect(error.code).toBe('E101');
      expect(error.name).toBe('SchemaRefError');
      expect(error.details.ref).toBe('#/definitions/User');
    });
  });

  describe('ServerError', () => {
    it('should create server error', () => {
      const error = new ServerError('Server failed to start');
      expect(error.code).toBe('E200');
      expect(error.name).toBe('ServerError');
    });
  });

  describe('PortError', () => {
    it('should create port error with port in details', () => {
      const error = new PortError('Port in use', 3000);
      expect(error.code).toBe('E201');
      expect(error.name).toBe('PortError');
      expect(error.details.port).toBe(3000);
    });
  });

  describe('FileError', () => {
    it('should create file error with file path', () => {
      const error = new FileError('File not found', '/path/to/file.json', 'read');
      expect(error.code).toBe('E300');
      expect(error.name).toBe('FileError');
      expect(error.details.filePath).toBe('/path/to/file.json');
      expect(error.details.operation).toBe('read');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field info', () => {
      const error = new ValidationError('Invalid port', 'port', 99999);
      expect(error.code).toBe('E400');
      expect(error.name).toBe('ValidationError');
      expect(error.details.field).toBe('port');
      expect(error.details.value).toBe(99999);
    });
  });

  describe('formatError', () => {
    it('should format SchemockError with details', () => {
      const error = new ValidationError('Invalid port', 'port', 99999);
      const formatted = formatError(error);
      
      expect(formatted).toContain('[E400]');
      expect(formatted).toContain('Invalid port');
      expect(formatted).toContain('Details:');
    });

    it('should include suggestions for PortError', () => {
      const error = new PortError('Port already in use', 3000);
      const formatted = formatError(error);
      
      expect(formatted).toContain('💡 Hint:');
      expect(formatted).toContain('Try starting with a different port');
      expect(formatted).toContain('3000');
    });

    it('should include suggestions for FileError', () => {
      const error = new FileError('File not found', '/path/to/file.json', 'read');
      const formatted = formatError(error);
      
      expect(formatted).toContain('💡 Hint:');
      expect(formatted).toContain('Make sure the file at');
      expect(formatted).toContain('/path/to/file.json');
    });

    it('should include suggestions for SchemaRefError', () => {
      const error = new SchemaRefError('Cannot resolve ref', '#/definitions/User');
      const formatted = formatError(error);
      
      expect(formatted).toContain('💡 Hint:');
      expect(formatted).toContain('Verify that the referenced definition exists');
      expect(formatted).toContain('#/definitions/User');
    });

    it('should format regular Error objects', () => {
      const error = new Error('Regular error');
      const formatted = formatError(error);
      
      expect(formatted).toBe('Regular error');
    });
  });
});
