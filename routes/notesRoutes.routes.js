const express = require('express');
const router = express.Router();

const notesController = require('../controllers/notes.controller');

// Index
router.get('/', notesController.index);

// Create new user Form
router.get('/create', notesController.createForm);

// Get single user by id
router.get('/update', notesController.update);

// Update a user
// router.put('/:user_id', notesController.update);

// Delete a user
// router.delete('/:user_id', notesController.delete);

module.exports = router;
