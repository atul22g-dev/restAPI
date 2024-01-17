const Product = require('../models/Product.model');

// Handle index actions
exports.index = async (req, res) => {
    res.status(200).render("index");
};

// create user Form
exports.createForm = async (req, res) => {
    res.status(200).render("createForm");
};

// Update user
exports.update = async (req, res) => {
    const Products = await Product.find();
    res.status(200).render("updateProduct",{Products});
};