/**
 * Comprehensive tests for validation utilities
 */
import {
  validatePort,
  validateFilePath,
  validateFileExists,
  validateSchema,
  validateLogLevel,
  validateProjectName,
  sanitizeString
} from '../src/utils/validation';
import { ValidationError, FileError } from '../src/errors';
import { mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';

describe('Validation Utilities', () => {
  describe('validatePort', () => {
    it('should accept valid port numbers', () => {
      expect(validatePort(3000)).toBe(3000);
      expect(validatePort('8080')).toBe(8080);
      expect(validatePort(1)).toBe(1);
      expect(validatePort(65535)).toBe(65535);
    });

    it('should reject invalid port numbers', () => {
      expect(() => validatePort('invalid')).toThrow(ValidationError);
      expect(() => validatePort(0)).toThrow(ValidationError);
      expect(() => validatePort(65536)).toThrow(ValidationError);
      expect(() => validatePort(-1)).toThrow(ValidationError);
      expect(() => validatePort(99999)).toThrow(ValidationError);
    });

    it('should provide helpful error messages', () => {
      try {
        validatePort('abc');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details.field).toBe('port');
      }
    });
  });

  describe('validateFilePath', () => {
    it('should accept valid file paths', () => {
      const path = validateFilePath('schema.json');
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
    });

    it('should reject null bytes', () => {
      expect(() => validateFilePath('file\0.json')).toThrow(ValidationError);
    });

    it('should reject empty paths', () => {
      expect(() => validateFilePath('')).toThrow(ValidationError);
      expect(() => validateFilePath(null as any)).toThrow(ValidationError);
    });

    it('should convert relative to absolute paths', () => {
      const path = validateFilePath('./test.json');
      expect(path).toContain('test.json');
      expect(path).not.toContain('./');
    });

    it('should detect directory traversal attempts', () => {
      const baseDir = process.cwd();
      const parentDir = join(baseDir, '..');
      
      expect(() => {
        validateFilePath('../../../etc/passwd', baseDir);
      }).toThrow(ValidationError);
    });
  });

  describe('validateFileExists', () => {
    const testDir = join(__dirname, 'test-validation');
    const testFile = join(testDir, 'test.json');

    beforeAll(() => {
      if (!require('fs').existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      writeFileSync(testFile, '{}');
    });

    afterAll(() => {
      if (require('fs').existsSync(testFile)) {
        unlinkSync(testFile);
      }
      if (require('fs').existsSync(testDir)) {
        rmdirSync(testDir);
      }
    });

    it('should accept existing files', () => {
      expect(() => validateFileExists(testFile)).not.toThrow();
    });

    it('should reject non-existent files', () => {
      expect(() => {
        validateFileExists(join(testDir, 'nonexistent.json'));
      }).toThrow(FileError);
    });
  });

  describe('validateSchema', () => {
    it('should accept valid schemas', () => {
      expect(() => {
        validateSchema({ type: 'string' });
      }).not.toThrow();

      expect(() => {
        validateSchema({ $ref: '#/definitions/User' });
      }).not.toThrow();

      expect(() => {
        validateSchema({ oneOf: [{ type: 'string' }, { type: 'number' }] });
      }).not.toThrow();
    });

    it('should reject non-object schemas', () => {
      expect(() => validateSchema(null)).toThrow(ValidationError);
      expect(() => validateSchema('string')).toThrow(ValidationError);
      expect(() => validateSchema(123)).toThrow(ValidationError);
    });

    it('should reject invalid schema types', () => {
      expect(() => {
        validateSchema({ type: 'invalid-type' });
      }).toThrow(ValidationError);
    });

    it('should accept valid type arrays', () => {
      expect(() => {
        validateSchema({ type: ['string', 'number', 'null'] });
      }).not.toThrow();
    });
  });

  describe('validateLogLevel', () => {
    it('should accept valid log levels', () => {
      expect(validateLogLevel('error')).toBe('error');
      expect(validateLogLevel('warn')).toBe('warn');
      expect(validateLogLevel('info')).toBe('info');
      expect(validateLogLevel('debug')).toBe('debug');
    });

    it('should reject invalid log levels', () => {
      expect(() => validateLogLevel('invalid')).toThrow(ValidationError);
      expect(() => validateLogLevel('trace')).toThrow(ValidationError);
      expect(() => validateLogLevel('')).toThrow(ValidationError);
    });
  });

  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(validateProjectName('my-project')).toBe('my-project');
      expect(validateProjectName('project123')).toBe('project123');
      expect(validateProjectName('a')).toBe('a');
      expect(validateProjectName('my-api-server')).toBe('my-api-server');
    });

    it('should reject invalid project names', () => {
      expect(() => validateProjectName('My-Project')).toThrow(ValidationError); // Uppercase
      expect(() => validateProjectName('my_project')).toThrow(ValidationError); // Underscore
      expect(() => validateProjectName('-myproject')).toThrow(ValidationError); // Starts with hyphen
      expect(() => validateProjectName('myproject-')).toThrow(ValidationError); // Ends with hyphen
      expect(() => validateProjectName('my project')).toThrow(ValidationError); // Space
    });

    it('should reject reserved names', () => {
      expect(() => validateProjectName('node_modules')).toThrow(ValidationError);
      expect(() => validateProjectName('favicon.ico')).toThrow(ValidationError);
    });

    it('should enforce length limits', () => {
      const longName = 'a'.repeat(101);
      expect(() => validateProjectName(longName)).toThrow(ValidationError);
    });
  });

  describe('sanitizeString', () => {
    it('should accept clean strings', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('test@example.com')).toBe('test@example.com');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00World\x1F';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x1F');
    });

    it('should preserve newlines and tabs', () => {
      const input = 'Hello\nWorld\tTest';
      expect(sanitizeString(input)).toBe(input);
    });

    it('should enforce length limits', () => {
      const longString = 'a'.repeat(1001);
      expect(() => sanitizeString(longString)).toThrow(ValidationError);
      
      const customLimit = 'a'.repeat(51);
      expect(() => sanitizeString(customLimit, 50)).toThrow(ValidationError);
    });

    it('should reject non-string input', () => {
      expect(() => sanitizeString(123 as any)).toThrow(ValidationError);
      expect(() => sanitizeString(null as any)).toThrow(ValidationError);
      expect(() => sanitizeString({} as any)).toThrow(ValidationError);
    });
  });
});
