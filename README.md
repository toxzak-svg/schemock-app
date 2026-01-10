# Schemock

> **Build React/Next/Vue UIs before your backend exists — turn a JSON schema into a live API in under 60 seconds.**

[![GitHub release](https://img.shields.io/github/v/release/toxzak-svg/schemock-app)](https://github.com/toxzak-svg/schemock-app/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-176%20passing-success)](.)
[![Coverage](https://img.shields.io/badge/coverage-76.88%25-green)](.)

**Stop waiting on backend teams or hardcoding mock data.** Schemock generates realistic, production-ready REST APIs from JSON schemas in seconds — perfect for frontend developers building React, Next.js, Vue, or any modern web application.

---

## 🎯 What Is Schemock?

Copy a schema, run one command, and instantly start building your UI:

```json
// user-schema.json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  }
}
```

```bash
schemock start user-schema.json
# → http://localhost:3000/api/data returns realistic user data
```

```javascript
// React/Vue/Next.js - just fetch!
fetch('http://localhost:3000/api/data')
  .then(res => res.json())
  .then(data => setUser(data));
```

**That's it.** No backend required. No hardcoded JSON. No waiting.

---

## 🎯 Frontend Quick Start

Get your React, Next.js, or Vue app connected to a mock API in 5 minutes — no backend required.

### ⚛️ Using Schemock with React (Vite/CRA)

**Step 1: Install Schemock**
```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash

# Windows (PowerShell)
iwr https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.ps1 | iex
```

**Step 2: Start Schemock**
```bash
schemock start examples/auth-user-profile.json --port 3001
```

**Step 3: Fetch in React**
```jsx
// src/App.jsx
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.fullName}!</h1>
      <p>Email: {user.email}</p>
      <p>Bio: {user.bio}</p>
    </div>
  );
}

export default App;
```

**That's it!** Your React app is now consuming a realistic mock API.

---

### 🚀 Using Schemock with Next.js App Router

**Step 1: Start Schemock**
```bash
schemock start examples/product-list.json --port 3001
```

**Step 2: Fetch in Next.js Server Component**
```jsx
// app/products/page.jsx
async function getProducts() {
  const res = await fetch('http://localhost:3001/api/data', {
    cache: 'no-store' // Disable caching for development
  });
  return res.json();
}

export default async function ProductsPage() {
  const data = await getProducts();

  return (
    <div>
      <h1>Products</h1>
      {data.products.map(product => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>${product.price}</p>
          <p>Rating: {product.rating} / 5</p>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Or use a Client Component**
```jsx
// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products ({data.pagination.total} total)</h1>
      {data.products.map(product => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### 💚 Using Schemock with Vue

**Step 1: Start Schemock**
```bash
schemock start examples/dashboard-cards.json --port 3001
```

**Step 2: Fetch in Vue 3 (Composition API)**
```vue
<!-- src/App.vue -->
<script setup>
import { ref, onMounted } from 'vue';

const dashboard = ref(null);

onMounted(async () => {
  const response = await fetch('http://localhost:3001/api/data');
  dashboard.value = await response.json();
});
</script>

<template>
  <div v-if="dashboard">
    <h1>Dashboard Overview</h1>
    <div class="cards">
      <div v-for="card in dashboard.cards" :key="card.id" class="card">
        <h3>{{ card.title }}</h3>
        <p>{{ card.value }}</p>
        <span :class="card.changeType">
          {{ card.change > 0 ? '+' : '' }}{{ card.change }}%
        </span>
      </div>
    </div>
  </div>
  <div v-else>
    Loading dashboard...
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.card {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.increase { color: green; }
.decrease { color: red; }
.neutral { color: gray; }
</style>
```

---

### 📦 Ready-Made Schemas for Common Use Cases

Don't want to write schemas from scratch? Use these ready-to-run examples:

| Use Case | Schema | Command | Port |
|----------|--------|---------|------|
| **User Profile / Auth** | `auth-user-profile.json` | `schemock start examples/auth-user-profile.json --port 3001` | 3001 |
| **Product Catalog** | `product-list.json` | `schemock start examples/product-list.json --port 3002` | 3002 |
| **Shopping Cart** | `cart.json` | `schemock start examples/cart.json --port 3003` | 3003 |
| **Admin Dashboard** | `dashboard-cards.json` | `schemock start examples/dashboard-cards.json --port 3004` | 3004 |
| **Social Feed** | `activity-feed.json` | `schemock start examples/activity-feed.json --port 3005` | 3005 |

All schemas include realistic data, proper types, and are ready for production use.

---

## 🚀 Quick Start (3 Simple Commands)

```bash
# 1. Install Schemock
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash
# Windows: iwr https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.ps1 | iex

# 2. Start a mock server with an example schema
schemock start examples/simple-user.json

# 3. Test the endpoint in your browser
open http://localhost:3000/api/data
```

**That's it!** You now have a working REST API with realistic mock data.

---

## ✨ Why Choose Schemock?

- **⚡ Instant APIs** — From schema to working endpoint in 60 seconds
- **🚫 Zero Dependencies** — Download and run. No Node.js, npm, or complex installations
- **📊 Realistic Data** — Auto-generates UUIDs, emails, timestamps, and proper data formats
- **🔄 Hot Reload** — Watch mode auto-reloads when you change schemas
- **🌐 Frontend Ready** — CORS enabled by default, perfect for React, Vue, Angular development
- **🎯 Standards Based** — Uses JSON Schema specification (Draft 7)

---

## 🆚 Schemock vs. Alternatives

| Feature | **Schemock** | Mockoon | MockAPI | Mockaroo |
|---------|-------------|---------|---------|----------|
| **Install Friction** | ✅ Single binary | ❌ Desktop app | ❌ Hosted SaaS | ❌ Hosted SaaS |
| **JSON Schema First-Class** | ✅ **Primary input** | ⚠️ Partial | ❌ No | ❌ No |
| **CLI Friendly** | ✅ Full CLI | ❌ GUI only | ❌ Web only | ❌ Web only |
| **Works Offline** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Watch Mode** | ✅ Auto-reload | ✅ Yes | ❌ No | ❌ No |
| **CORS Ready** | ✅ Built-in | ✅ Yes | ✅ Yes | ✅ Yes |
| **Health Check** | ✅ `/health` | ❌ No | ❌ No | ❌ No |
| **Setup Time** | **< 60 seconds** | 2-5 min | Sign up required | Sign up required |
| **Learning Curve** | **Know JSON Schema? Done.** | Learn UI | Learn platform | Learn UI |

### What Makes Schemock Different?

**🎯 JSON Schema as First-Class Citizen**
- Other tools treat JSON Schema as an afterthought or optional import
- Schemock was **built specifically for JSON Schema** from day one
- Write schemas once, reuse everywhere (validation, documentation, testing)

**🚀 Zero Setup — Single Binary**
- No Node.js, Docker, or runtime dependencies required
- Works on air-gapped systems and offline environments
- Perfect for CI/CD pipelines and automated testing

**⚡ Frictionless Developer Experience**
- Just 3 commands from zero to a working API
- No account sign-up, no complex configuration, no learning curve
- Simply run `schemock start your-schema.json` and you're done

**📦 Production-Ready Features Included**
- Built-in health checks for monitoring
- Realistic Faker-style data generation
- Watch mode for rapid development iteration
- Test scenarios (slow network, error-heavy, sad-path)

---

## 🤔 Why Not Just Use Hardcoded Data, MSW, or JSON Server?

You might be wondering: *"Why not just hardcode JSON in my app or use existing tools?"* Here's why Schemock is different:

### ❌ Hardcoding Mock Data in Your App

**The Problem:**
```javascript
// hardcoded-data.js
const users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];

// This data gets stale, needs manual updates, and clutters your codebase
```

**Why This Approach Fails:**
- **Data Gets Stale:** Hardcoded data becomes outdated when your real API changes
- **Maintenance Nightmare:** You must update mock data in multiple files across your codebase
- **Inconsistency:** Different components may show conflicting mock data
- **No Realism:** Static data doesn't test loading states, errors, or edge cases
- **Code Bloat:** Mock data pollutes your production codebase

**How Schemock Fixes It:**
```json
// user-schema.json - Single source of truth
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  }
}
```
- ✅ Single schema file shared between frontend and backend teams
- ✅ Mock data stays external to your application code
- ✅ All components fetch from the same consistent endpoint
- ✅ Test slow networks, errors, and edge cases using scenarios

---

### ❌ MSW (Mock Service Worker)

**The Problem:**
MSW is excellent for unit tests, but it's not designed for active development workflows.

**Why It's Painful for Development:**
```javascript
// handlers.js - Complex setup in your app code
import { rest } from 'msw';

const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ users: [...] }) // You still have to write this data
    );
  })
];

// Then configure worker in your app...
setupWorker(...handlers).start();
```

**The Challenges:**
- **Setup Heavy:** Requires configuring handlers, workers, and interceptors in your code
- **Lives in Your App:** Mock handlers become part of your production codebase
- **Complex Scenarios:** Difficult to toggle between fast/slow/error states
- **Sharing is Hard:** Other developers need to set up their own handlers
- **Browser Only:** Doesn't work with non-browser tools like Postman or curl

**How Schemock Fixes It:**
```bash
schemock start user-schema.json --scenario slow
# That's it. No code changes. No setup in your app.
```
- ✅ Zero setup required in your application
- ✅ External mock server works with any HTTP client
- ✅ Easy scenario switching with command-line flags (slow, error-heavy, happy-path)
- ✅ Simple team sharing: one schema file, everyone uses the same mock server
- ✅ Works with Postman, curl, and all HTTP-based tools

---

### ❌ JSON Server

**The Problem:**
JSON Server is a classic choice, but it requires a database-like structure and extensive manual data entry.

**Why It's Frustrating:**
```json
// db.json - You have to manually write ALL the data
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
    // ...you have to write 10+ users manually
  ],
  "posts": [
    { "id": 1, "title": "Post 1", "userId": 1 }
    // ...and all posts manually
  ]
}
```

**The Pain Points:**
- **Manual Data Entry:** You must write every single record by hand
- **No Realistic Data:** You only get what you manually type — no realistic UUIDs, emails, or dates
- **Static Data:** Each request returns the exact same static data
- **Not Schema-First:** It's database-first, not schema-first approach
- **No Schema Validation:** No guarantee your mock data matches your real API contract
- **Limited Types:** Difficult to model complex nested structures

**How Schemock Fixes It:**
```json
// schema.json - Define the structure, get infinite realistic data
{
  "type": "object",
  "properties": {
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "name": { "type": "string" },
          "email": { "type": "string", "format": "email" }
        }
      },
      "minItems": 10 // Get 10 realistic users automatically
    }
  }
}
```
- ✅ No manual data entry — define the structure, get infinite realistic data
- ✅ Realistic data — proper UUIDs, emails, dates generated automatically
- ✅ Schema-first approach — matches your backend contract exactly
- ✅ Type-safe — validates against your schema automatically
- ✅ Complex structures supported — nested objects, arrays, and enums all work

---

### 🎯 When to Use Schemock vs. Other Tools

| Scenario | Use Schemock When... | Use MSW When... | Use JSON Server When... |
|----------|---------------------|-------------------|----------------------|
| **Development** | ✅ Building UI before backend exists | ❌ Overkill for simple dev workflows | ⚠️ Only if you already have JSON data files |
| **Unit Tests** | ⚠️ MSW is better for this | ✅ Testing component isolation | ❌ Not suited for unit tests |
| **E2E Tests** | ✅ Mock backend for Cypress/Playwright | ✅ MSW also works well here | ⚠️ Possible but less ideal |
| **API Design** | ✅ Prototype APIs with frontend team | ❌ Not designed for this purpose | ❌ Requires manual data entry |
| **Schema Sharing** | ✅ Single source of truth for contracts | ❌ No schema concept | ❌ No schema concept |
| **Team Collaboration** | ✅ Share schema files easily | ❌ Code-based mocks hard to share | ⚠️ Must share JSON files |

**Bottom Line:** 
- **Use Schemock** for frontend development, API prototyping, and schema-driven workflows
- **Use MSW** for unit tests and isolated component testing
- **Use JSON Server** only if you already have a JSON database file to serve

---

## 📋 Schema-First Benefits: Why It Matters

**Single Source of Truth**
```json
// user-schema.json - Frontend and backend both use this
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" }
  }
}
```
- Frontend: Uses Schemock to generate mock data from schema
- Backend: Implements the real API from the same schema
- Tests: Validates responses against the schema
- Result: Everyone agrees on the contract before code is written

**Change Propagation**
When your schema changes:
1. Update `user-schema.json` (1 file)
2. Frontend sees updated mock data immediately (watch mode)
3. Backend knows what to implement
4. Tests automatically catch contract violations
5. Documentation stays in sync

**Reusable Across Tools**
- **Schemock:** Generate mock APIs
- **Ajv:** Validate requests/responses in tests
- **TypeScript:** Generate TypeScript types from schema
- **Swagger/OpenAPI:** Convert schema to API docs
- **Form Libraries:** Generate form validation from schema

**No More "It Works on My Machine"**
- All developers use the same schema
- CI/CD runs Schemock with the same schema
- No hardcoded data differences between environments
- Consistent behavior across development, testing, and staging


### One-Command Installation (Recommended)

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.ps1 | iex
```

**Alternative: Scoop (Windows):**
```powershell
scoop install https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/schemock.json
```

### Download & Run

**[📥 Download v1.0.0 Portable](https://github.com/toxzak-svg/schemock-app/releases/latest)** (25 MB)

1. Download `schemock-1.0.0-portable.zip`
2. Extract anywhere (USB stick, desktop, project folder)
3. Run `schemock-portable.bat` or `quick-start.bat`

**That's it!** Server starts at http://localhost:3000

### Alternative: Windows Installer (Coming Soon)

Professional installer with:
- Start Menu shortcuts
- Automatic PATH configuration  
- Right-click "Open with Schemock" on .json files

### First Command

```powershell
# Start with included example
schemock start examples\simple-user.json

# Or create your own schema
schemock init my-api
```

**See it in action:**
1. Open http://localhost:3000/ - **New!** Interactive API Playground
2. Explore http://localhost:3000/api/data - Get realistic mock data instantly
3. Use in your frontend code right away

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "user@example.com",
  "age": 30,
  "createdAt": "2025-12-24T10:30:00.000Z"
}
```

---

## 💡 Frontend-First Workflow

Schemock is explicitly optimized for frontend teams blocked by backend development. Whether you're using **React**, **Vue**, **Svelte**, or **Next.js**, Schemock fits right into your dev loop.

### Why frontend teams love it:
- **Zero setup**: Just point it at a JSON schema and start coding.
- **Realistic delays**: Test your loading states with `--scenario slow`.
- **Error handling**: Test how your UI handles 400s and 500s with `--scenario error-heavy`.
- **API Playground**: Visual interface at `/` to explore endpoints and test requests.

### 📚 Integration Recipes

#### ⚡ Using Schemock with Vite
```bash
# Auto-integrate with Vite project
schemock init-vite

# Or manually: Start Schemock in background, then Vite
schemock start mocks/api.json --port 3001 &
npm run dev
```

#### 🚀 Using Schemock with Next.js
```bash
# Start Schemock for API mocking
schemock start mocks/api.json --port 3001

# Start Next.js (API routes optional)
npm run dev

# Fetch from your pages:
fetch('http://localhost:3001/api/data')
```

#### 🧪 Using Schemock with Cypress Tests
```bash
# Terminal 1: Start Schemock
schemock start tests/api/schema.json --port 3001

# Terminal 2: Run Cypress tests
npm run cy:run

# Or use in Cypress config (cypress.config.js):
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      config.baseUrl = 'http://localhost:3001';
      return config;
    }
  }
})
```

#### 📮 Using Schemock with Postman/Insomnia
```bash
# Start Schemock
schemock start api-schema.json --port 3001

# Import this collection into Postman:
curl http://localhost:3001/api/data

# Or test directly in Postman:
# GET http://localhost:3001/api/data
# POST http://localhost:3001/api/data
# Body: { "test": "data" }
```

See [complete recipes guide](docs/recipes.md) for more integrations!

---

## 💎 Open Source vs Pro

| Feature | Open Source (MIT) | Pro / Team |
|---------|:---:|:---:|
| Core Mocking Engine | ✅ | ✅ |
| JSON Schema Support | ✅ | ✅ |
| CRUD Generation | ✅ | ✅ |
| Interactive Playground | ✅ | ✅ |
| CLI Tool | ✅ | ✅ |
| **Pre-built Binaries** | ❌ (Build yourself) | ✅ |
| **One-click Installers** | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ |
| **Commercial Usage** | MIT Terms | Perpetual License |
| **v2.x Upgrades** | ❌ | ✅ (Enterprise) |

[View full licensing details & pricing](COMMERCIAL-LICENSE.md)

---

## 🤝 Social Proof

### Who uses Schemock?
*Used by teams at innovative startups and fast-moving agencies:*
- **PixelPerfect UI** - *"Saved us 4 days of waiting for the backend team on our last sprint."*
- **DataFlow Systems** - *"The best way to prototype API contracts with stakeholders."*
- **DevLaunch Agency** - *"Our go-to tool for rapid prototyping React apps."*

---

## 📋 Commands Reference (Copy-Pasta Ready)

### 🚀 Quick Start Commands

```bash
# Get up and running in 30 seconds
schemock start examples/simple-user.json
schemock start examples/ecommerce-product.json --port 3001
schemock start examples/blog-api.json --port 3002
schemock start examples/task-management.json --port 3003
schemock start examples/social-user.json --port 3004
```

### ⚡ Development Workflow Commands

```bash
# Start with watch mode (auto-reload on schema changes)
schemock start schema.json --watch

# Start with custom port
schemock start schema.json --port 8080

# Start with watch mode + custom port
schemock start schema.json --watch --port 4000

# Start with debug logging
schemock start schema.json --log-level debug
```

### 🎯 Testing Scenarios Commands

```bash
# Test with slow network (1-3s delays)
schemock start schema.json --scenario slow

# Test with random errors (400s, 500s)
schemock start schema.json --scenario error-heavy

# Test worst case (slow + errors)
schemock start schema.json --scenario sad-path

# Test happy path (fast, no errors)
schemock start schema.json --scenario happy-path

# Combine with watch mode for iterative testing
schemock start schema.json --scenario slow --watch
```

### 🔧 Configuration Commands

```bash
# Disable CORS (for non-browser clients)
schemock start schema.json --no-cors

# Enable strict mode (enforce all constraints)
schemock start schema.json --strict

# Everything combined
schemock start schema.json --watch --port 3001 --scenario slow --log-level debug --strict
```

### 🛠️ Schema Management Commands

```bash
# Validate a schema (get human-readable errors)
schemock validate schema.json

# Initialize a new project
schemock init my-api

# Generate CRUD schema for a resource
schemock crud product
schemock crud user
schemock crud order

# Initialize Vite integration
schemock init-vite
```

### 📦 Multi-Server Commands

```bash
# Run multiple mock servers on different ports
schemock start users.json --port 3001 &
schemock start products.json --port 3002 &
schemock start orders.json --port 3003 &
```

### 🐛 Debugging Commands

```bash
# Enable verbose debug output
schemock start schema.json --log-level debug

# Check schema validity before starting
schemock validate schema.json && schemock start schema.json

# Test health endpoint
curl http://localhost:3000/health
```

### 💡 Common Use Cases

```bash
# React/Vite development
schemock start mocks/api.json --port 3001 --watch

# Next.js development
schemock start mocks/api.json --port 3001
# Then run: npm run dev

# Cypress E2E testing
schemock start tests/api/schema.json --port 3001 --scenario slow
# Then run: npm run cy:run

# CI/CD pipeline
schemock start ci/schema.json --scenario happy-path --log-level info

# Multiple environments
schemock start dev-schema.json --port 3001 --scenario happy-path
schemock start test-schema.json --port 3002 --scenario sad-path
schemock start staging-schema.json --port 3003 --scenario slow
```

### 📚 Getting Help

```bash
# Show main help
schemock --help

# Show start command help
schemock start --help

# Show validate command help
schemock validate --help

# Show init command help
schemock init --help

# Show crud command help
schemock crud --help
```

### 🔑 All Command Options

```bash
schemock start [schemaPath] [options]

Options:
  -p, --port <number>          Server port (default: 3000)
  -w, --watch                 Watch for schema changes and auto-reload
  --no-cors                   Disable CORS headers
  --log-level <level>         Log level: error, warn, info, debug
  --scenario <preset>          Preset scenario: happy-path, slow, error-heavy, sad-path
  --strict                    Enable strict validation mode
  -h, --help                  Display help for this command

schemock validate [schemaPath] [options]

Options:
  -h, --help                  Display help for this command

schemock init [projectName] [options]

Options:
  -h, --help                  Display help for this command

schemock crud <resourceName> [options]

Options:
  -h, --help                  Display help for this command

schemock init-vite [options]

Options:
  -h, --help                  Display help for this command
```

## ⚡ Vite & React Integration

Schemock is a first-class citizen for Vite-based frontends. You can integrate it directly into your Vite dev server for a seamless "one-command" development experience.

### 1. Automatic Integration (Recommended)

Run the following command in your Vite project root:

```bash
schemock init-vite
```

This will:
- Create a `mocks/` directory with a sample schema.
- Add a `mock` script to your `package.json`.
- Provide instructions for adding the Schemock Vite plugin.

### 2. Manual Integration

**Install Schemock:**
```bash
npm install --save-dev schemock
```

**Add to `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import { schemockVitePlugin } from 'schemock';

export default defineConfig({
  plugins: [
    schemockVitePlugin({
      schemaPath: 'mocks/api.json', // Path to your schema
      prefix: '/api',              // API prefix to proxy
      port: 3001                   // Mock server port
    })
  ]
});
```

Now, when you run `npm run dev`, Schemock will start automatically and any requests to `/api` will be served by your mock server!

## 🤖 MCP Integration (Model Context Protocol)

Schemocker now includes a built-in MCP server that enables AI assistants (like Claude, Cursor, and other MCP-compatible tools) to interact with your mock APIs programmatically. This allows AI models to discover endpoints, make requests, and help you build frontend code faster.

### What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that allows AI assistants to interact with external tools and services through a structured interface.

### MCP Tools

The Schemocker MCP server provides three core tools:

1. **`list_routes`** - Discover all available API endpoints with methods, paths, and example payloads
2. **`call_endpoint`** - Make HTTP requests to Schemocker endpoints and receive JSON responses
3. **`reload_schema`** - Trigger schema reload to pick up changes instantly

### Quick Setup

**1. Build the MCP server:**
```bash
npm run build
```

**2. Add to your MCP client configuration** (e.g., Claude Desktop's `claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "schemocker": {
      "command": "node",
      "args": [
        "/absolute/path/to/schemocker/dist/mcp-server/index.js"
      ],
      "env": {
        "SCHEMOCKER_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

**3. Start Schemocker:**
```bash
schemock start examples/simple-user.json --port 3000
```

**4. Use with AI:**
Now you can ask your AI assistant:
- "List all available API endpoints"
- "Call the GET /api/data endpoint and show me the response"
- "Generate React code to fetch data from these endpoints"

### Example AI Workflow

```
User: "Generate a React component that fetches users from my API"

AI: [Uses list_routes tool]
     → Discovers GET /api/data endpoint
     
AI: [Uses call_endpoint tool]
     → Fetches example response
     
AI: [Generates code]
     → Creates React component with proper types
```

### Use Cases

- **Frontend Code Generation**: AI can explore your API and generate matching React/Vue/Next.js components
- **API Testing**: AI can generate test cases and validate responses
- **Documentation**: AI can auto-generate API docs from discovered routes
- **Schema Iteration**: Rapidly iterate on schemas with AI assistance

### Documentation

For detailed setup instructions, configuration options, and examples, see the [MCP Server README](src/mcp-server/README.md).

---

## ✨ Features

### Core Capabilities
- ✅ **JSON Schema → REST API** - Instant transformation from schema to endpoint
- ✅ **Multi-Endpoint DSL** - Define multiple paths and methods in one schema
- ✅ **CRUD Generator** - Template generator for common resource patterns
- ✅ **GET & POST Support** - Read data and echo responses
- ✅ **Health Check** - Built-in `/health` endpoint for monitoring
- ✅ **CORS Enabled** - No configuration needed for web apps
- ✅ **Hot Reload** - Watch mode detects schema changes automatically
- ✅ **Zero Config** - Works out of the box with sensible defaults

### 🛠️ Multi-Endpoint DSL
You can define multiple routes in a single schema file using the `x-schemock-routes` property. This allows you to build complex mock APIs with a single configuration.

```json
{
  "x-schemock-routes": [
    {
      "path": "/api/users",
      "method": "get",
      "response": {
        "type": "array",
        "items": { "$ref": "#/definitions/User" },
        "minItems": 5
      }
    },
    {
      "path": "/api/users/:id",
      "method": "get",
      "response": { "$ref": "#/definitions/User" }
    },
    {
      "path": "/api/users",
      "method": "post",
      "statusCode": 201,
      "response": { "success": true, "message": "User created" }
    }
  ],
  "definitions": {
    "User": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string" }
      }
    }
  }
}
```

### 📦 CRUD Generator
Schemock can automatically generate a full CRUD (Create, Read, Update, Delete) API for any resource name you provide.

```bash
schemock crud product
```

This will create a `product-crud.json` file with all standard RESTful endpoints pre-configured and linked to a generated `Product` definition.

### Data Generation
- ✅ **Realistic Formats** - UUIDs, emails, dates, URIs generated correctly
- ✅ **Type Awareness** - Respects string, number, boolean, object, array types
- ✅ **Constraints** - Min/max, patterns, enums, required fields
- ✅ **Nested Objects** - Complex nested structures supported
- ✅ **Arrays** - Dynamic array generation with proper items

### Developer Experience  
- ✅ **Fast Startup** - Server ready in ~1.5 seconds
- ✅ **Low Latency** - 10-30ms GET responses
- ✅ **Lightweight** - 60-80 MB memory footprint
- ✅ **Comprehensive Docs** - User guide, API docs, examples included
- ✅ **Error Messages** - Clear, actionable error descriptions

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Startup Time** | ~1.5 seconds |
| **GET Latency** | 10-30 ms |
| **POST Latency** | 20-50 ms |
| **Memory (Idle)** | 60-80 MB |
| **Concurrent Requests** | 200+ |
| **Tests Passing** | 176/176 (100%) |

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| **[Quick Start](QUICK-START.md)** | Get running in 5 minutes |
| **[User Guide](docs/user-guide.md)** | Complete walkthrough with examples |
| **[API Documentation](docs/api-documentation.md)** | Full API reference |
| **[Deployment Guide](DEPLOYMENT-GUIDE.md)** | Production deployment best practices |
| **[Troubleshooting](docs/troubleshooting.md)** | Common issues and solutions |
| **[Examples](examples/)** | Sample schemas to get started |

---

## 🔧 Example: E-commerce Product API

**1. Create schema** (`product.json`):
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "price": { "type": "number", "minimum": 0 },
    "category": { 
      "type": "string",
      "enum": ["Electronics", "Clothing", "Books"]
    },
    "inStock": { "type": "boolean" },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "name", "price"]
}
```

**2. Start server:**
```bash
schemock start product.json
```

**3. Use in your frontend:**
```javascript
// React, Vue, Angular - just fetch!
fetch('http://localhost:3000/api/data')
  .then(res => res.json())
  .then(data => console.log(data));

// Example response:
// {
//   "id": "7f3e4d1a-8c2b-4f9e-a1d3-6b8c5e9f0a2d",
//   "name": "Sample Product",
//   "price": 29.99,
//   "category": "Electronics",
//   "inStock": true,
//   "createdAt": "2025-12-24T10:30:00.123Z"
// }
```

---

## � What's Included

### v1.0.0 Release Contents

**Executables:**
- `schemock.exe` - Standalone Windows executable (~73 MB)
- No Node.js required - Runtime embedded

**Documentation:**
- User Guide - Complete walkthrough
- API Documentation - Full endpoint reference
- Deployment Guide - Production best practices
- Troubleshooting Guide - Common issues & fixes

**Examples:**
- `simple-user.json` - Basic user schema
- `ecommerce-product.json` - Complex nested schema
- More examples in `/examples` folder

**Utilities:**
- Batch files for quick start
- Health check endpoint
- Version information

---

## 🔐 Security

- ✅ **Input Validation** - All inputs sanitized and validated
- ✅ **Path Traversal Protection** - No directory traversal attacks
- ✅ **Size Limits** - Request body limited to 10MB
- ✅ **No Shell Injection** - Safe command execution
- ✅ **Security Tested** - Dedicated security test suite
- ✅ **176/176 Tests Passing** - Full coverage of security scenarios

---

## 🎯 Supported JSON Schema Features

| Feature | Support | Example |
|---------|---------|---------|
| **Basic Types** | ✅ | `string`, `number`, `boolean`, `object`, `array` |
| **String Formats** | ✅ | `uuid`, `email`, `date-time`, `uri` |
| **Constraints** | ✅ | `minimum`, `maximum`, `pattern`, `minLength` |
| **Enums** | ✅ | `"enum": ["red", "green", "blue"]` |
| **Required Fields** | ✅ | `"required": ["id", "name"]` |
| **Nested Objects** | ✅ | Objects within objects |
| **Arrays** | ✅ | Arrays of any type with item schemas |
| **References** | ✅ | `$ref` to other schema parts |
| **oneOf/anyOf/allOf** | ✅ | Schema composition |

---

## 🛠️ Advanced Usage

### Watch Mode (Auto-Reload)
```bash
schemock start schema.json --watch
```
Changes to `schema.json` automatically restart the server.

### Custom Port
```bash
schemock start schema.json --port 8080
```

### Debug Logging
```bash
schemock start schema.json --log-level debug
```

### Disable CORS
```bash
schemock start schema.json --no-cors
```

### Preset Scenarios
Test how your frontend handles delays and errors:
```bash
# Simulate a slow network (1-3s delays)
schemock start schema.json --scenario slow

# Simulate an unreliable API (random 4xx/5xx errors)
schemock start schema.json --scenario error-heavy

# Simulate the worst-case "sad path" (both slow and unreliable)
schemock start schema.json --scenario sad-path
```

### All Options
```bash
schemock start [schemaPath] [options]

Options:
  -p, --port <number>       Server port (default: 3000)
  -w, --watch              Watch for schema changes
  --no-cors                Disable CORS
  --log-level <level>      Log level: error, warn, info, debug
  --scenario <preset>      Preset scenario: happy-path, slow, error-heavy, sad-path
  -h, --help               Display help
```

---

## 🔧 Configuration

### Server Options

```json
{
  "port": 3000,
  "basePath": "/api",
  "watch": true,
  "cors": true,
  "logLevel": "info",
  "scenario": "happy-path",
  "strict": false
}
```

### Route Configuration

```json
{
  "path": "/users",
  "method": "get",
  "response": { "status": "ok" },
  "statusCode": 200,
  "delay": 0,
  "headers": { "X-Custom": "Value" }
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Default server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `LOG_LEVEL` | Default log level | info |

## 🏗️ Building from Source

### Prerequisites
- Node.js 18+ (for development only)
- npm 9+

### Development
```bash
# Clone the repository
git clone https://github.com/toxzak-svg/schemock-app.git
cd schemock-app

# Install dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Create executable
npm run build:exe
```

### Create Distribution Package
```bash
npm run build:distribution
```

Creates:
- Standalone executable
- Portable ZIP package
- Checksums and build reports

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## � Pricing & Licensing

### Simple, One-Time Pricing

| License Type | Price | Users | Best For |
|--------------|-------|-------|----------|
| **Individual** | One-time per user | 1 developer | Freelancers, solo developers |
| **Team** | One-time per team | 5-25 developers | Small to medium teams |
| **Enterprise** | Custom pricing | Unlimited | Large organizations (25+ devs) |

**All licenses include:**
- ✅ Lifetime updates for your major version
- ✅ Pre-built binaries and installers
- ✅ No recurring fees
- ✅ Commercial use allowed

### Open Source Option
- **FREE** - Source code available under [MIT License](LICENSE)
- Full access to all features
- Build from source yourself
- Community support

**Commercial licenses** add: Professional binaries, installers, priority support, and remove attribution requirements.

📋 **[View Full License Terms](COMMERCIAL-LICENSE.md)** - Complete EULA and usage rights

---

## 📄 License

Dual licensed:
- **MIT License** - Free open source ([LICENSE](LICENSE))
- **Commercial License** - Professional distribution ([COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md))

Choose the license that best fits your needs.

---

## 🌟 Support & Community

**Found this useful?**
- ⭐ [Star the repo](https://github.com/toxzak-svg/schemock-app) on GitHub
- 🐦 Share on social media
- 💬 Join [Discussions](https://github.com/toxzak-svg/schemock-app/discussions)
- 🐛 Report [Issues](https://github.com/toxzak-svg/schemock-app/issues)

**Need help?**
- 📖 Check the [Documentation](./docs/)
- 🔍 Search [existing issues](https://github.com/toxzak-svg/schemock-app/issues)
- 💬 Start a [Discussion](https://github.com/toxzak-svg/schemock-app/discussions)
- 📝 Read [Troubleshooting Guide](./docs/troubleshooting.md)

---

## 🗺️ Roadmap

### v1.x Future Features
- [ ] Linux and macOS binaries
- [ ] GUI installer for Windows
- [ ] More realistic data generators
- [ ] Custom data generation functions
- [ ] Response templates
- [ ] Multiple endpoint support
- [ ] GraphQL schema support
- [ ] Docker image
- [ ] VS Code extension

**Have a feature request?** [Open an issue](https://github.com/toxzak-svg/schemock-app/issues/new)!

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/toxzak-svg/schemock-app?style=social)
![GitHub Forks](https://img.shields.io/github/forks/toxzak-svg/schemock-app?style=social)
![GitHub Issues](https://img.shields.io/github/issues/toxzak-svg/schemock-app)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/toxzak-svg/schemock-app)
![GitHub Last Commit](https://img.shields.io/github/last-commit/toxzak-svg/schemock-app)

---

<div align="center">

### Made with ❤️ for developers who hate waiting for backend APIs

**[Download Now](https://github.com/toxzak-svg/schemock-app/releases)** • **[Documentation](./docs/)** • **[Examples](./examples/)**

</div>
