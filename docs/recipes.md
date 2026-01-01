# Schemock Recipes

Practical examples of how to integrate Schemock into your frontend workflow.

## ⚡ Using Schemock with Vite dev server

Proxy requests from your Vite application to Schemock during development.

### 1. Start Schemock
```bash
schemock start user.json --port 3000
```

### 2. Configure `vite.config.ts`
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Now, calls to `/api/users` in your code will be handled by Schemock.

---

## 🚀 With Next.js API routes disabled

If you're building a Next.js app but the backend isn't ready, you can proxy all `/api` calls to Schemock.

### 1. Start Schemock
```bash
schemock start schema.json --port 3000
```

### 2. Configure `next.config.js`
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};
```

---

## 🧪 With Cypress tests

Use Schemock to provide stable, predictable data for your E2E tests.

### 1. Start Schemock in your CI/CD pipeline
```bash
schemock start tests/fixtures/auth-success.json --port 3001 &
```

### 2. Configure Cypress `cypress.config.ts`
```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // Your app
    env: {
      apiUrl: 'http://localhost:3001/api',
    },
  },
});
```

### 3. Use in tests
```typescript
describe('Login Flow', () => {
  it('should log in successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back, Test User');
  });
});
```

---

## 🎨 With Storybook

Mock API calls for your components in Storybook.

### 1. Install `storybook-addon-mock`
```bash
npm install -D storybook-addon-mock
```

### 2. Use Schemock data in your story
```typescript
import { SchemaParser } from 'schemock';
import userSchema from './user.schema.json';

const mockUser = SchemaParser.parse(userSchema);

export const Default = {
  parameters: {
    mockData: [
      {
        url: '/api/users/1',
        method: 'GET',
        status: 200,
        response: mockUser,
      },
    ],
  },
};
```
