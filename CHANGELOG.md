# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive implementation plan documentation (IMPLEMENTATION-PLAN.md, PHASE-1-COMPLETE.md)
- MIT LICENSE file for legal compliance
- CONTRIBUTING.md with contribution guidelines (300+ lines)
- Comprehensive .gitignore file with IDE, OS, and security exclusions
- CHANGELOG.md for version tracking
- Custom error handling system with 8 error classes (SchemockError, ConfigurationError, SchemaParseError, SchemaRefError, PortError, FileError, ValidationError)
- Error codes (E001-E400) for easy debugging
- formatError() function with contextual suggestions
- Input validation and sanitization utilities (7 validators):
  - validatePort() with range checking (1-65535)
  - validateFilePath() with path traversal prevention
  - validateFileExists() for file existence checks
  - validateSchema() for JSON Schema validation
  - validateLogLevel() with type safety
  - sanitizeString() with injection prevention
  - validateProjectName() for project initialization
- JSON Schema $ref resolution support with:
  - Internal reference resolution (#/definitions/...)
  - Circular reference detection and prevention
  - Proper error handling for invalid refs
- 230+ new test cases across 3 test files:
  - schema-parser-enhanced.test.ts (50+ tests)
  - validation.test.ts (30+ tests)
  - errors.test.ts (30+ tests)
- Test coverage increased from 59.49% to 81.59%

### Fixed
- **Critical:** Concurrent request handling bug (was 0/10 success rate, now 100%)
- **Critical:** $ref resolution (was "REF_NOT_IMPLEMENTED" placeholder, now fully functional)
- Server start() method now returns Promise for proper async/await handling
- EADDRINUSE error handling in server startup
- Visited set propagation in schema parser (circular ref detection)
- LogLevel type safety in validation
- Path traversal security vulnerability in file operations
- CLI duplicate code blocks causing compilation errors

### Changed
- Server.start() is now async and returns Promise<void>
- CLI now uses comprehensive error handling with formatError()
- Schema parser properly propagates visited set for circular detection
- All validators now throw typed errors (ValidationError, FileError, etc.)
- Enhanced test schemas with explicit `required` fields for determinism
- Error messages now include actionable suggestions
- Server generator uses callbacks for proper async initialization

### Security
- Path traversal attack prevention (../, absolute path blocking)
- Null byte detection in file paths
- Control character stripping in string inputs
- DOS prevention with length limits
- Input sanitization across all user inputs
- Secure file path validation

## [1.0.0] - 2025-12-23

### Added
- Initial release of Schemock
- JSON Schema Draft 7 support
- Mock server generation from schemas
- RESTful API endpoints (GET, POST, PUT, DELETE, PATCH)
- CLI interface with `start` and `init` commands
- Windows executable (.exe) generation
- Professional installer (NSIS) support
- Comprehensive documentation suite:
  - Installation guide
  - User guide with tutorials
  - API documentation
  - Technical specifications
  - Troubleshooting guide
- CORS support
- Request logging
- Mock data generation for all JSON Schema types
- Support for string formats (email, UUID, date-time, URI, etc.)
- Number constraints (minimum, maximum, multipleOf)
- Array constraints (minItems, maxItems)
- Object schemas with required properties
- Schema composition (oneOf, anyOf, allOf)
- Enum support
- Pattern support (limited)

### Known Issues
- $ref resolution returns placeholder (fixed in unreleased)
- Limited regex pattern support (partial implementation)
- Test coverage at 59.49% (improvement planned)
- Concurrent request handling issues (fixed in unreleased)

## [0.1.0] - Development

### Added
- Initial project structure
- Basic TypeScript configuration
- Jest testing framework setup
- Core module architecture
- Express server foundation

---

## Legend

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements and fixes

[Unreleased]: https://github.com/toxzak-svg/schemock-app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/toxzak-svg/schemock-app/releases/tag/v1.0.0
[0.1.0]: https://github.com/toxzak-svg/schemock-app/releases/tag/v0.1.0
