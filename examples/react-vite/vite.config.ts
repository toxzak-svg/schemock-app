import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { schemockVitePlugin } from 'schemock';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Integrate Schemock directly into the Vite dev server
    schemockVitePlugin({
      schemaPath: 'mocks/api.json',
      prefix: '/api',
      port: 3001
    })
  ]
});
