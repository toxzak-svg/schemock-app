# Schemock

A lightweight mock server generator from JSON schemas

![Schemock Logo](https://via.placeholder.com/400x200/4A90E2/FFFFFF?text=Schemock)

## 🚀 Quick Start

### Installation

**Option 1: Global Installation**
```bash
npm install -g schemock
schemock start
```

**Option 2: Windows Installer (Recommended)**
1. Download `Schemock-Setup.exe` from [releases](https://github.com/yourusername/schemock/releases)
2. Run installer
3. Launch from Start Menu

**Option 3: Portable Version**
1. Download `schemock-portable.zip`
2. Extract to any folder
3. Run `schemock.exe`

### Usage

**Quick Start Options:**
```bash
schemock start schema.json              # Start with custom schema
schemock start                          # Start with default schema
schemock init my-api                  # Initialize new project
```

**Advanced Examples:**
```bash
schemock start user.json --port 8080 --log-level debug
schemock start api.json --no-cors
schemock init ecommerce-api --name "E-commerce API" --port 4000
```

**Command Reference:**
```bash
schemock start --help              # Show start command options
schemock init --help               # Show init command options
schemock --version                   # Show version
schemock --help                      # Show general help
```

## ✨ Features

- 🎯 **Schema-Driven**: Generate mock APIs from JSON Schema definitions
- 🔄 **RESTful**: Support for GET, POST, PUT, DELETE, PATCH methods
- 📝 **Dynamic Responses**: Custom response generators based on request parameters
- 🌐 **CORS Support**: Built-in CORS handling for web applications
- 📊 **Realistic Data**: Smart data generation with proper formats and constraints
- 🚀 **High Performance**: Fast startup and response times
- 🛠️ **Developer Friendly**: Comprehensive CLI with helpful error messages
- 📚 **Rich Documentation**: Extensive guides and examples

## 📖 Documentation

- **[Installation Guide](docs/installation-setup.md)** - Detailed setup instructions
- **[User Guide](docs/user-guide.md)** - Step-by-step tutorials
- **[API Documentation](docs/api-documentation.md)** - Complete API reference
- **[Technical Specifications](docs/technical-specifications.md)** - Architecture details
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🔧 Usage Examples

### Basic Mock Server

Create a simple user management API:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User API",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 120 }
  },
  "required": ["id", "name", "email"]
}
```

Start the server:
```bash
schemock start user-schema.json --port 3000
```

Access the API:
```bash
# Get mock data
curl http://localhost:3000/api/data

# Send data to echo endpoint
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello"}'
```

### Custom Server Configuration

```javascript
const { createMockServer } = require('schemock');

const server = createMockServer(userSchema, {
  port: 3000,
  cors: true,
  logLevel: 'info'
});
```

### Advanced Custom Routes

```javascript
const { ServerGenerator } = require('schemock');

const config = {
  server: { port: 3000, cors: true },
  routes: {
    'get:/api/users': {
      path: '/api/users',
      method: 'get',
      response: () => generateMockUsers()
    },
    'post:/api/users': {
      path: '/api/users',
      method: 'post',
      response: (req) => ({
        message: 'User created',
        user: { ...req.body, id: generateId() }
      }),
      statusCode: 201
    }
  }
};

const server = new ServerGenerator(config);
server.start();
```

## 📊 Schema Support

Schemock supports comprehensive JSON Schema features:

### Basic Types
- ✅ String (with formats, patterns, length constraints)
- ✅ Number/Integer (with ranges, multiples, exclusives)
- ✅ Boolean
- ✅ Object (properties, required fields)
- ✅ Array (item schemas, length constraints)
- ✅ Null

### Advanced Features
- ✅ Schema Composition (oneOf, anyOf, allOf)
- ✅ Enum values
- ✅ References ($ref)
- ✅ String formats (email, uuid, date-time, uri, etc.)
- ✅ Regular expression patterns
- ✅ Default values

### Example Schema

```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "id": { 
          "type": "string", 
          "format": "uuid" 
        },
        "profile": {
          "oneOf": [
            { "type": "null" },
            {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "avatar": { 
                  "type": "string", 
                  "format": "uri" 
                }
              }
            }
          ]
        }
      }
    }
  },
  "required": ["user"]
}
```

## 🛠️ CLI Commands

### `schemock start [schemaPath]`

Start a mock server with optional schema file.

**Options:**
- `-p, --port <number>` - Server port (default: 3000)
- `--no-cors` - Disable CORS
- `--log-level <level>` - Log level (error, warn, info, debug)

**Examples:**
```bash
schemock start
schemock start api.json --port 8080
schemock start user.json --log-level debug --no-cors
```

### `schemock init [directory]`

Initialize a new mock server project.

**Options:**
- `--name <name>` - Project name (default: my-mock-server)
- `--port <port>` - Default port (default: 3000)

**Examples:**
```bash
schemock init
schemock init my-api --name "User API" --port 4000
```

## 🔧 Configuration

### Server Options

```javascript
{
  port: 3000,              // Server port (1-65535)
  basePath?: string,         // Base path for all routes
  watch?: boolean,           // Watch for file changes
  cors?: boolean,            // Enable/disable CORS
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
}
```

### Route Configuration

```javascript
{
  path: string,              // Route path
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  response: any,            // Response data or function
  statusCode?: number,      // HTTP status code (default: 200)
  delay?: number,           // Response delay in milliseconds
  headers?: Record<string, string> // Custom headers
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Default server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `LOG_LEVEL` | Default log level | info |

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test -- --coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🏗️ Building

### Development Build

```bash
npm run build
```

### Windows Executable

```bash
npm run build:exe
```

### Complete Release Package

```bash
npm run build:all
```

## 📦 Distribution

### Released Files

- **schemock.exe** - Standalone Windows executable
- **Schemock-Setup.exe** - Windows installer with shortcuts
- **schemock-portable.zip** - Portable version
- **docs/** - Complete documentation
- **examples/** - Example schemas and configurations

### Versioning

Follows [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Breaking changes: Increment MAJOR
- New features: Increment MINOR
- Bug fixes: Increment PATCH

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/schemock.git
cd schemock

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [https://schemock.dev/docs](https://schemock.dev/docs)
- **API Reference**: [https://schemock.dev/api](https://schemock.dev/api)
- **GitHub Repository**: [https://github.com/yourusername/schemock](https://github.com/yourusername/schemock)
- **Issue Tracker**: [https://github.com/yourusername/schemock/issues](https://github.com/yourusername/schemock/issues)
- **Releases**: [https://github.com/yourusername/schemock/releases](https://github.com/yourusername/schemock/releases)

## 🙋 Support

- **Documentation**: Check the [docs](./docs/) folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/schemock/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/schemock/discussions)

## 🌟 Acknowledgments

- Built with [Node.js](https://nodejs.org/)
- Web framework by [Express.js](https://expressjs.com/)
- CLI interface by [Commander.js](https://commander.js/)
- Testing with [Jest](https://jestjs.io/)

---

<div align="center">

**Made with ❤️ by the Schemock Team**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/schemock?style=social)](https://github.com/yourusername/schemock/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/schemock?style=social)](https://github.com/yourusername/schemock/network/members)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/schemock)](https://github.com/yourusername/schemock/issues)
[![GitHub license](https://img.shields.io/github/license/yourusername/schemock)](https://github.com/yourusername/schemock/blob/main/LICENSE)

</div>