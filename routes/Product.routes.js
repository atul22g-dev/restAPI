const express = require('express');
const router = express.Router();

const productController = require('../controllers/Product.controller');

// Get all users
router.get('/', productController.index);

// Create new user
router.post('/', productController.new);

// Get single user by id
router.get('/:user_id', productController.view);

// Update a user
router.put('/:user_id', productController.update);

// Delete a user
router.delete('/:user_id', productController.delete);

module.exports = router;
