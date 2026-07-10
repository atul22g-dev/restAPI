const express = require('express');
const router = express.Router();

const productController = require('../controllers/Product.controller');
const { validateProductCreate, validateProductUpdate } = require('../middleware/validate');

// Get all products
router.get('/', productController.index);

// Create new product
router.post('/', validateProductCreate, productController.new);

// Get single product by ID
router.get('/:id', productController.view);

// Update a product (partial update allowed)
router.put('/:id', validateProductUpdate, productController.update);

// Delete a product
router.delete('/:id', productController.delete);

module.exports = router;
