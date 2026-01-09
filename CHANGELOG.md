# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - v1.0.2

### Added
- ESLint v9 flat config support with `eslint.config.mjs`
- Prettier integration for code formatting
- `.npmignore` file for npm package distribution
- `.prettierignore` and `.prettierrc.json` configuration files
- Husky v9 pre-commit hooks with lint-staged
- `.lintstagedrc.json` for staged file linting

### Changed
- Migrated from legacy `.eslintrc` to ESLint v9 flat config format
- Updated Husky configuration to v9 (deprecated warning fixes)
- Test coverage improved from 74.13% to 78.79% (statements)
- Repository URL corrections in package.json

### Fixed
- Husky deprecation warnings with updated hook configuration
- ESLint configuration compatibility with TypeScript
- Code formatting consistency across the project

## [2.0.0] - 2026-01-01

### Added
- **Realistic Data Generation (Heuristics):**
  - Enhanced `SchemaParser` with property-name-based heuristics to generate realistic names, emails, phone numbers, prices, cities, and more
  - Added support for `date` and `time` formats in JSON Schema
  - Improved `ipv4` generation with randomized segments
  - Context-aware generation: `SchemaParser` now accepts property name hints for better data guessing
- **CLI UX Improvements:**
  - New `schemock recipes` command to display integration guides (Vite, Next.js, Cypress, Storybook) directly in the terminal
  - New `--resource` option for `schemock start` to quickly mock a specific resource without a schema file
  - Refined `schemock init` output with clearer "Next steps" and better visual feedback
  - Updated default schema for `schemock start` (no args) to include `id`, `name`, and `email` for a more "live" feel
- **Project Distribution:**
  - Added `docs/**/*` to pre-built binary assets, enabling the `recipes` command in standalone executables

### Fixed
- Fixed hardcoded values for `email` and `uuid` formats in `SchemaParser`; they are now more dynamic

## [1.0.1] - 2026-01-01

### Added
- **CLI Enhanced Tests** (`__tests__/cli-enhanced.test.ts`)
  - 68 comprehensive tests covering all CLI commands
  - Tests for init, start, validate, crud-generator, recipes, install, and help commands
  - Error handling and edge case coverage
- **Routes Generator Tests** (`__tests__/routes-generator.test.ts`)
  - 28 tests for route configuration generation
  - CRUD route generation tests
  - DSL generation coverage
- **Server Generator Enhanced Tests** (`__tests__/server-generator-enhanced.test.ts`)
  - Enhanced coverage for server functionality
  - Route setup, response handling, and scenario tests
  - Strict mode validation tests
- **Installer Service Tests** (`__tests__/installer-service.test.ts`)
  - Comprehensive installer testing
  - Service lifecycle tests
  - UI template handling
- **Main Entry Point Tests** (`__tests__/index.test.ts`)
  - 25 tests for the main `createMockServer` function
  - Module exports verification
  - Server configuration tests
  - Schema handling tests
- **Playground Generator Tests** (`__tests__/playground.test.ts`)
  - 88 tests for HTML playground generation
  - Route card generation tests
  - JavaScript functionality coverage
  - Responsive design and accessibility tests
- **Vite Integration Tests** (`__tests__/vite-integration.test.ts`)
  - 66 tests for Vite plugin functionality
  - Configuration options tests
  - Proxy configuration coverage
  - Error handling and edge cases

### Changed
- Test coverage improved from 74.13% to 81.88% (+7.75%)
- Total tests in suite: 385+ passing (250+ new tests added)
- Modules with 100% coverage: errors module
- Modules with >90% coverage: routes (93.75%), playground (94.73%)

### Fixed
- Failing tests in CLI test suite
- Failing tests in routes generator test suite
- TypeScript compilation errors in new test files
- Improved test reliability and stability

## [1.0.0] - 2025-12-24

### Added - User-Facing Features
- **Vite & React Integration:**
  - New `schemockVitePlugin` for seamless integration into Vite dev servers
  - Automatic proxy configuration and mock server lifecycle management within Vite
  - New `schemock init-vite` command to quickly set up Schemock in existing Vite projects
  - Comprehensive React + Vite example in `examples/react-vite`
- **Interactive Playground:**
  - Auto-generated HTML playground at the root URL (`/`)
  - "Try it out" feature to send requests and view JSON responses directly in the browser
  - Tabbed interface to switch between "Try it out" and "Schema" view for each route
  - Request timing and status code display
  - Support for request bodies in POST, PUT, and PATCH requests
  - "Copy to Clipboard" feature for response data and schemas
  - Improved UI with refined CSS and transition effects
- **Enhanced VS Code Extension:**
  - Robust server lifecycle management (Start/Stop)
  - New "Open Playground" command
  - Improved Status Bar integration with clear status indicators
  - Explorer context menu integration for one-click mock starting
  - Complete extension structure in `vscode-extension` directory
  - Context menu integration for `.json` files to start Schemock
  - Status bar integration and server control commands
- **Scoop Support:**
  - Added `schemock.json` manifest for easy installation on Windows via Scoop
- **CLI Features:**
  - New `validate` CLI command to validate schemas and show human-readable hints with line numbers
  - New `--strict` flag for both `start` and `validate` commands
  - New `--scenario` flag in CLI `start` command to flip between API behaviors
  - Supported scenarios: `happy-path` (default), `slow` (delayed responses), `error-heavy` (frequent 4xx/5xx errors), and `sad-path` (both slow and error-heavy)
  - `schemock init` now generates a comprehensive `README.md` for the new project
  - Improved "Next steps" feedback for all initialization commands
- **One-Command Distribution:**
  - `install.sh`: One-command installer for Linux and macOS
  - `install.ps1`: One-command installer for Windows (PowerShell)
  - Updated `README.md` with quick installation instructions
- **Richer Dynamic Behavior:**
  - Support for parameterized routes (e.g., `/api/users/:id`)
  - In-memory state management for CRUD operations (POST stores, GET lists/by ID, PUT updates, DELETE removes)
  - Consistency in mock data generation: requesting the same ID returns the same object
  - Smarter default route generation based on schema title
  - Support for port 0 in ServerGenerator to allow random available ports in tests
- **Core Features:**
  - JSON Schema Draft 7 support
  - Mock server generation from schemas
  - RESTful API endpoints (GET, POST, PUT, DELETE, PATCH)
  - CLI interface with `start` and `init` commands
  - Windows executable (.exe) generation
  - Professional installer (NSIS) support
  - CORS support
  - Request logging
  - Mock data generation for all JSON Schema types
  - Support for string formats (email, UUID, date-time, URI, etc.)
  - Number constraints (minimum, maximum, multipleOf)
  - Array constraints (minItems, maxItems)
  - Object schemas with required properties
  - Schema composition (oneOf, anyOf, allOf)
  - Enum support
  - Pattern support
- **Documentation:**
  - Comprehensive installation guide
  - User guide with tutorials
  - API documentation
  - Technical specifications
  - Troubleshooting guide

### Added - Phase 1 (Completed 2025-12-24)
- **Legal & Licensing:**
  - MIT LICENSE file for legal compliance
  - CONTRIBUTING.md with contribution guidelines (300+ lines)
  - CHANGELOG.md for version tracking
- **Error Handling System:**
  - Custom error handling with 8 error classes (SchemockError, ConfigurationError, SchemaParseError, SchemaRefError, PortError, FileError, ValidationError)
  - Error codes (E001-E400) for easy debugging
  - formatError() function with contextual suggestions
- **Input Validation & Sanitization:**
  - validatePort() with range checking (1-65535)
  - validateFilePath() with path traversal prevention
  - validateFileExists() for file existence checks
  - validateSchema() for JSON Schema validation
  - validateLogLevel() with type safety
  - sanitizeString() with injection prevention
  - validateProjectName() for project initialization
- **JSON Schema $ref Resolution:**
  - Internal reference resolution (#/definitions/...)
  - Circular reference detection and prevention
  - Proper error handling for invalid refs
- **Testing Infrastructure (Phase 1):**
  - 230+ new test cases across 3 test files
  - schema-parser-enhanced.test.ts (50+ tests)
  - validation.test.ts (30+ tests)
  - errors.test.ts (30+ tests)
  - Test coverage increased from 59.49% to 81.59%

### Added - Phase 2 (Completed 2025-12-23)
- **Watch Mode Implementation:**
  - File watching with chokidar for hot-reload capability
  - SchemaWatcher class with EventEmitter pattern for schema change notifications
  - `--watch` CLI flag for automatic server restart on schema changes
  - Graceful server restart with state preservation
  - Cross-platform file watching support (Windows, macOS, Linux)
- **Performance Testing Suite:**
  - Comprehensive performance benchmarks (performance.test.ts)
  - Throughput testing: 1818 req/s (82% above 1000 req/s target)
  - Latency benchmarks: P95 11-36ms (64-89% under 100ms target)
  - P99 latency: 12ms (88% under target)
  - Memory profiling: 34MB per 1000 requests
  - Reliability testing: 100% success rate under load
  - HTTP method performance testing (GET, POST)
  - Sequential and concurrent request testing (1, 10, 50 concurrent)
- **Security Audit & Testing:**
  - Security fuzzing test suite (security.test.ts, 81 tests)
  - All 81/81 security tests passing (100%)
  - Path traversal attack prevention (11/11 tests)
  - Null byte injection protection (3/3 tests)
  - Prototype pollution prevention (3/3 tests)
  - Control character filtering (2/2 tests)
  - Port fuzzing validation (14/14 tests)
  - Shell injection prevention (5/5 tests)
  - File extension bypass blocking (5/5 tests)
  - Unicode attack handling (4/4 tests)
  - Type confusion protection (4/4 tests)
  - SECURITY.md policy document
  - npm audit compliance (0 vulnerabilities)
- **Enhanced Server Lifecycle Management:**
  - stop() method for graceful shutdown
  - restart(config) method for configuration updates
  - isRunning() status checker
  - getConfig() configuration accessor
  - SIGINT/SIGTERM signal handling for cleanup
- **Enhanced Validation (Production Grade):**
  - Port validation: Integer checking, type validation, infinity/NaN rejection
  - Schema validation: Strict object validation, array rejection, required type enforcement
  - File path validation: Executable extension blocking (.exe, .bat, .cmd, .sh, etc.)
  - String sanitization: Shell character removal (|, \`, $, ;, &)
  - Project name: Strict npm package naming compliance
  - Absolute path rejection in validateFilePath()
  - ValidationError throwing for all security violations
  - Enhanced path traversal prevention
- **Testing Infrastructure (Phase 2):**
  - chokidar mock (__mocks__/chokidar.ts) for cross-platform testing
  - Jest moduleNameMapper configuration for ESM compatibility
  - 13 new watcher tests (watcher.test.ts)
  - 7 new performance tests (performance.test.ts)
  - 81 new security fuzzing tests (security.test.ts)
  - 176/176 total tests passing (100% pass rate)
  - 80.74% code coverage (exceeds 80% requirement)

### Changed
- Server.start() is now async and returns Promise<void>
- Server.start() enhanced with lifecycle management hooks
- CLI now uses comprehensive error handling with formatError()
- CLI now supports async watch mode with graceful shutdown
- Schema parser properly propagates visited set for circular detection
- All validators now throw typed errors (ValidationError, FileError, etc.)
- Error messages now include actionable suggestions
- Server generator uses callbacks for proper async initialization
- Export SchemaWatcher from main index.ts for programmatic use
- Strict vs Loose mode for schema generation and validation
- Request validation in `strict` mode for POST, PUT, and PATCH requests

### Fixed
- False circular reference detection in `SchemaParser` when the same `$ref` is used multiple times in different branches
- Incorrect wrapping of custom routes defined in `x-schemock-routes`
- Proper escaping of template literals in generated playground HTML
- Improved terminal icon and naming in VS Code extension
- Concurrent request handling bug (was 0/10 success rate, now 100%)
- $ref resolution (was "REF_NOT_IMPLEMENTED" placeholder, now fully functional)
- EADDRINUSE error handling in server startup
- chokidar ESM module compatibility with Jest (mock + moduleNameMapper)
- Schema parser test determinism (added required fields to test schemas)
- CLI tests compatibility with enhanced security validation
- Memory leaks in file watcher with proper cleanup on close()
- Server restart race conditions with isRunning() checks
- Path traversal security vulnerability in file operations

### Security
- Path traversal attack prevention (../, absolute path blocking)
- Null byte detection in file paths
- Control character stripping in string inputs
- DOS prevention with length limits
- Input sanitization across all user inputs
- Secure file path validation
- Enhanced path traversal prevention with absolute path rejection
- Prototype pollution attack prevention (__proto__, constructor, prototype blocking)
- File URI scheme blocking (file://, \\\\?\\)
- Special character filtering in file paths ($, %, ~)
- Responsible disclosure process established

---

## Legend

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements and fixes

[Unreleased]: https://github.com/toxzak-svg/schemocker/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/toxzak-svg/schemocker/releases/tag/v2.0.0
[1.0.1]: https://github.com/toxzak-svg/schemocker/releases/tag/v1.0.1
[1.0.0]: https://github.com/toxzak-svg/schemocker/releases/tag/v1.0.0
