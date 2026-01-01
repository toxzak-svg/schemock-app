import { generateRouteConfigs, generateRoutes, generateCRUDDSL } from '../src/generators/routes';
import { Schema } from '../src/types';

describe('Routes Generator', () => {
  describe('generateRouteConfigs', () => {
    it('should generate route configs from schema with title', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const routes = generateRouteConfigs(schema);

      expect(routes).toBeDefined();
      expect(routes['get:/api/users']).toBeDefined();
      expect(routes['get:/api/users/:id']).toBeDefined();
      expect(routes['post:/api/users']).toBeDefined();
      expect(routes['put:/api/users/:id']).toBeDefined();
      expect(routes['delete:/api/users/:id']).toBeDefined();
    });

    it('should use "items" as default resource name when title is missing', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const routes = generateRouteConfigs(schema);

      expect(routes['get:/api/items']).toBeDefined();
      expect(routes['get:/api/items/:id']).toBeDefined();
    });

    it('should generate GET all items route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/products'];

      expect(getRoute).toBeDefined();
      expect(getRoute.method).toBe('get');
      expect(getRoute.path).toBe('/api/products');
      expect(typeof getRoute.response).toBe('function');
    });

    it('should generate GET by ID route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/products/:id'];

      expect(getRoute).toBeDefined();
      expect(getRoute.method).toBe('get');
      expect(getRoute.path).toBe('/api/products/:id');
      expect(typeof getRoute.response).toBe('function');
    });

    it('should generate POST route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const postRoute = routes['post:/api/products'];

      expect(postRoute).toBeDefined();
      expect(postRoute.method).toBe('post');
      expect(postRoute.path).toBe('/api/products');
    });

    it('should generate PUT route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const putRoute = routes['put:/api/products/:id'];

      expect(putRoute).toBeDefined();
      expect(putRoute.method).toBe('put');
      expect(putRoute.path).toBe('/api/products/:id');
    });

    it('should generate DELETE route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const deleteRoute = routes['delete:/api/products/:id'];

      expect(deleteRoute).toBeDefined();
      expect(deleteRoute.method).toBe('delete');
      expect(deleteRoute.path).toBe('/api/products/:id');
    });

    it('should call GET handler with request object', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/users/:id'];
      const mockReq = { params: { id: '123' } };

      const response = getRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('id', '123');
    });

    it('should call POST handler with request body', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const postRoute = routes['post:/api/users'];
      const mockReq = { body: { name: 'Test User' } };

      const response = postRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('name', 'Test User');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');
    });

    it('should call PUT handler with request body', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const putRoute = routes['put:/api/users/:id'];
      const mockReq = { 
        params: { id: '123' },
        body: { name: 'Updated User' }
      };

      const response = putRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('id', '123');
      expect(response.data).toHaveProperty('name', 'Updated User');
      expect(response.data).toHaveProperty('updatedAt');
    });

    it('should call DELETE handler with request params', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const deleteRoute = routes['delete:/api/users/:id'];
      const mockReq = { params: { id: '123' } };

      const response = deleteRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('id', '123');
      expect(response).toHaveProperty('message');
    });
  });

  describe('generateRoutes', () => {
    it('should generate Express router code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toBeDefined();
      expect(typeof routerCode).toBe('string');
      expect(routerCode).toContain("const express = require('express')");
      expect(routerCode).toContain("const router = express.Router()");
      expect(routerCode).toContain("const { v4: uuidv4 } = require('uuid')");
      expect(routerCode).toContain("let db = []");
      expect(routerCode).toContain("router.get('/'");
      expect(routerCode).toContain("router.get('/:id'");
      expect(routerCode).toContain("router.post('/'");
      expect(routerCode).toContain("router.put('/:id'");
      expect(routerCode).toContain("router.delete('/:id'");
    });

    it('should include GET all route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.get('/'");
      expect(routerCode).toContain('success: true');
      expect(routerCode).toContain('meta:');
    });

    it('should include GET by ID route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.get('/:id'");
      expect(routerCode).toContain('req.params.id');
      expect(routerCode).toContain('status(404)');
    });

    it('should include POST route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.post('/'");
      expect(routerCode).toContain('uuidv4()');
      expect(routerCode).toContain('createdAt');
      expect(routerCode).toContain('status(201)');
    });

    it('should include PUT route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.put('/:id'");
      expect(routerCode).toContain('updatedAt');
      expect(routerCode).toContain('req.params.id');
    });

    it('should include DELETE route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.delete('/:id'");
      expect(routerCode).toContain('status(204)');
      expect(routerCode).toContain('req.params.id');
    });

    it('should use correct pluralization in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Category'
      };

      const routerCode = generateRoutes(schema);

      // Note: The function lowercases the title and adds 's', so 'Category' becomes 'categorys'
      // This is a known limitation in the simple pluralization logic
      expect(routerCode).toContain('/api/categorys');
      expect(routerCode).toContain('category');
    });

    it('should handle schema without title', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain('items');
      expect(routerCode).toContain('/api/items');
    });

    it('should handle schema with title "Item"', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Item',
        properties: {
          id: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain('items');
      expect(routerCode).toContain('/api/items');
    });
  });

  describe('generateCRUDDSL', () => {
    it('should generate CRUD DSL for a resource', () => {
      const dsl = generateCRUDDSL('User');

      expect(Array.isArray(dsl)).toBe(true);
      expect(dsl.length).toBe(5);
    });

    it('should generate GET collection route', () => {
      const dsl = generateCRUDDSL('User');
      const getCollection = dsl.find(r => r.path === '/api/users' && r.method === 'get');

      expect(getCollection).toBeDefined();
      expect(getCollection.response).toHaveProperty('type', 'array');
      expect(getCollection.response).toHaveProperty('minItems', 5);
      expect(getCollection.response).toHaveProperty('maxItems', 20);
    });

    it('should generate GET by ID route', () => {
      const dsl = generateCRUDDSL('User');
      const getById = dsl.find(r => r.path === '/api/users/:id' && r.method === 'get');

      expect(getById).toBeDefined();
      expect(getById.response).toHaveProperty('$ref', '#/definitions/User');
    });

    it('should generate POST route', () => {
      const dsl = generateCRUDDSL('User');
      const post = dsl.find(r => r.path === '/api/users' && r.method === 'post');

      expect(post).toBeDefined();
      expect(post).toHaveProperty('statusCode', 201);
      expect(post.response).toHaveProperty('type', 'object');
      expect(post.response.properties.success.type).toBe('boolean');
    });

    it('should generate PUT route', () => {
      const dsl = generateCRUDDSL('User');
      const put = dsl.find(r => r.path === '/api/users/:id' && r.method === 'put');

      expect(put).toBeDefined();
      expect(put.response).toHaveProperty('type', 'object');
      expect(put.response.properties.success.type).toBe('boolean');
      expect(put.response.properties.data.$ref).toBe('#/definitions/User');
    });

    it('should generate DELETE route', () => {
      const dsl = generateCRUDDSL('User');
      const del = dsl.find(r => r.path === '/api/users/:id' && r.method === 'delete');

      expect(del).toBeDefined();
      expect(del.response).toHaveProperty('type', 'object');
      expect(del.response.properties.success.type).toBe('boolean');
      expect(del.response.properties.message.type).toBe('string');
    });

    it('should use lowercase pluralization', () => {
      const dsl = generateCRUDDSL('Product');

      expect(dsl[0].path).toBe('/api/products');
      expect(dsl[1].path).toBe('/api/products/:id');
    });

    it('should handle single word resources', () => {
      const dsl = generateCRUDDSL('Item');

      expect(dsl[0].path).toBe('/api/items');
    });

    it('should handle multi-word resources', () => {
      const dsl = generateCRUDDSL('UserProfile');

      expect(dsl[0].path).toBe('/api/userprofiles');
    });
  });
});
