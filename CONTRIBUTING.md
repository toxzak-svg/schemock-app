# Contributing to Schemock

Thank you for your interest in contributing to Schemock! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js v18.x or v20.x (LTS versions)
- npm v9.x or higher
- Git
- TypeScript knowledge
- Familiarity with Express.js and JSON Schema

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/schemock-app.git
   cd schemock-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 🛠️ How to Contribute

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes** - Help us squash bugs!
- **Feature development** - Implement new features
- **Documentation** - Improve or add documentation
- **Testing** - Write tests to increase coverage
- **Code review** - Review pull requests
- **Design** - Improve UX/UI
- **Examples** - Add example schemas and use cases

### Finding Work

- Check [Issues](https://github.com/toxzak-svg/schemock-app/issues) for open tasks
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Look for issues labeled `help wanted` for tasks needing assistance
- Check the [Implementation Plan](IMPLEMENTATION-PLAN.md) for planned features

## 💻 Coding Standards

### TypeScript Style Guide

```typescript
// Use explicit types
function parseSchema(schema: Schema): MockData {
  // Implementation
}

// Use interfaces for object shapes
interface ServerConfig {
  port: number;
  cors: boolean;
}

// Use const for immutable values
const DEFAULT_PORT = 3000;

// Use descriptive variable names
const userSchema = loadSchema('user.json');
```

### Code Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Maximum line length: 100 characters
- Use meaningful variable and function names

### File Structure

```
src/
├── cli/           # Command-line interface
├── generators/    # Server and route generators
├── parsers/       # Schema parsing logic
├── types/         # TypeScript type definitions
└── index.ts       # Main entry point
```

### Naming Conventions

- **Files:** kebab-case (e.g., `schema-parser.ts`)
- **Classes:** PascalCase (e.g., `SchemaParser`)
- **Functions:** camelCase (e.g., `generateMockData`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`)
- **Interfaces:** PascalCase with 'I' prefix optional (e.g., `Schema` or `ISchema`)

## 🧪 Testing Guidelines

### Writing Tests

We use Jest for testing. All new features should include tests.

```typescript
describe('SchemaParser', () => {
  describe('parse', () => {
    it('should generate string from string schema', () => {
      const schema: Schema = { type: 'string' };
      const result = SchemaParser.parse(schema);
      expect(typeof result).toBe('string');
    });

    it('should handle invalid schema', () => {
      expect(() => {
        SchemaParser.parse(null as any);
      }).toThrow('Schema is required');
    });
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Include integration tests for workflows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- schema-parser.test.ts
```

## 📝 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(parser): add support for $ref resolution"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(cli): add --watch flag for hot reloading

Implements file watching to automatically reload server
when schema files change.

Closes #123
```

```
fix(parser): handle circular $ref references

Adds detection and prevention of infinite loops when
resolving circular schema references.

Fixes #456
```

### Submitting Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub**
   - Provide a clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Address review feedback**
   - Respond to code review comments
   - Make requested changes
   - Push updates to the same branch

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] Self-review completed

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Try the latest version** - bug may be fixed
3. **Gather information** about the issue

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. Use schema '...'
3. Send request '...'
4. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- OS: [e.g., Windows 11, macOS 13]
- Node.js version: [e.g., 18.16.0]
- Schemock version: [e.g., 1.0.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 Suggesting Enhancements

### Enhancement Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [JSON Schema Specification](https://json-schema.org/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Schemock! 🚀

---

**Questions?** Open an issue or start a discussion on GitHub.
