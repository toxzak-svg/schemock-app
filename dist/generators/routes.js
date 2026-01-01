"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRouteConfigs = generateRouteConfigs;
exports.generateRoutes = generateRoutes;
exports.generateCRUDDSL = generateCRUDDSL;
/**
 * Generate route handlers based on the provided schema
 * @param schema - The JSON schema to generate routes for
 * @returns An object containing route configurations
 */
function generateRouteConfigs(schema) {
    const resourceName = schema.title?.toLowerCase() || 'items';
    const resourceNamePlural = `${resourceName}s`;
    return {
        // GET all items
        [`get:/api/${resourceNamePlural}`]: {
            path: `/api/${resourceNamePlural}`,
            method: 'get',
            response: (req) => ({
                success: true,
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            })
        },
        // GET item by ID
        [`get:/api/${resourceNamePlural}/:id`]: {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'get',
            response: (req) => ({
                success: true,
                data: {
                    id: req.params.id,
                    // Add sample data based on schema
                    name: 'Sample Item',
                    description: 'This is a sample item',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            })
        },
        // CREATE new item
        [`post:/api/${resourceNamePlural}`]: {
            path: `/api/${resourceNamePlural}`,
            method: 'post',
            response: (req) => ({
                success: true,
                data: {
                    id: 'generated-id',
                    ...req.body,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            })
        },
        // UPDATE item
        [`put:/api/${resourceNamePlural}/:id`]: {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'put',
            response: (req) => ({
                success: true,
                data: {
                    id: req.params.id,
                    ...req.body,
                    updatedAt: new Date().toISOString()
                }
            })
        },
        // DELETE item
        [`delete:/api/${resourceNamePlural}/:id`]: {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'delete',
            response: (req) => ({
                success: true,
                message: 'Item deleted successfully',
                id: req.params.id
            })
        }
    };
}
// For backward compatibility
function generateRoutes(schema) {
    const resourceName = schema.title?.toLowerCase() || 'items';
    const resourceNamePlural = `${resourceName}s`;
    return `const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory database
let db = [];

// GET all ${resourceNamePlural}
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: db,
    meta: {
      total: db.length,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  });
});

// GET ${resourceName} by ID
router.get('/:id', (req, res) => {
  const item = db.find(item => item.id === req.params.id);
  if (!item) {
    return res.status(404).json({ 
      success: false,
      error: '${resourceName} not found' 
    });
  }
  res.json({
    success: true,
    data: item
  });
});

// CREATE new ${resourceName}
router.post('/', (req, res) => {
  const newItem = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.push(newItem);
  res.status(201).json({
    success: true,
    data: newItem
  });
});

// UPDATE ${resourceName}
router.put('/:id', (req, res) => {
  const index = db.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ 
      success: false,
      error: '${resourceName} not found' 
    });
  }
  
  const updatedItem = {
    ...db[index],
    ...req.body,
    id: req.params.id, // Prevent ID change
    updatedAt: new Date().toISOString()
  };
  
  db[index] = updatedItem;
  res.json(updatedItem);
});

// DELETE ${resourceName}
router.delete('/:id', (req, res) => {
  const index = db.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '${resourceName} not found' });
  }
  
  db = db.filter(item => item.id !== req.params.id);
  res.status(204).send();
});

// Reset database (for testing)
router.delete('/', (req, res) => {
  db = [];
  res.status(204).send();
});

module.exports = router;`;
}
/**
 * Generate a CRUD DSL for a resource
 * @param resourceName - The name of the resource (e.g., 'User')
 * @returns Array of route definitions
 */
function generateCRUDDSL(resourceName) {
    const resourceNamePlural = `${resourceName.toLowerCase()}s`;
    return [
        {
            path: `/api/${resourceNamePlural}`,
            method: 'get',
            response: {
                type: 'array',
                items: { $ref: `#/definitions/${resourceName}` },
                minItems: 5,
                maxItems: 20
            }
        },
        {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'get',
            response: { $ref: `#/definitions/${resourceName}` }
        },
        {
            path: `/api/${resourceNamePlural}`,
            method: 'post',
            response: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: `#/definitions/${resourceName}` },
                    message: { type: 'string' }
                },
                required: ['success', 'data']
            },
            statusCode: 201
        },
        {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'put',
            response: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: `#/definitions/${resourceName}` }
                },
                required: ['success', 'data']
            }
        },
        {
            path: `/api/${resourceNamePlural}/:id`,
            method: 'delete',
            response: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                },
                required: ['success', 'message']
            }
        }
    ];
}
//# sourceMappingURL=routes.js.map