const Product = require('../models/Product.model');

// Handle index actions
exports.index = async (req, res) => {
    try {
        const users = await Product.find();
        res.json({
            status: "success",
            message: "Users retrieved successfully",
            data: users
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            message: error.message
        });
    }
};

// Handle create user actions
exports.new = async (req, res) => {
    const user = new Product({
        company: req.body.company,
        featured: req.body.featured,
        name: req.body.name,
        price: req.body.price,
        rating: req.body.rating,
    });

    try {
        const savedUser = await user.save();
        res.json({
            message: 'New user created!',
            data: savedUser
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// Handle view user info
exports.view = async (req, res) => {
    try {
        const user = await Product.findById(req.params.user_id);
        if (!user) {
            res.status(404).send({
                message: 'User not found'
            });
        } else {
            res.json({
                message: 'User details loading..',
                data: user
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// Handle update user info
exports.update = async (req, res) => {
    try {
        const user = await Product.findByIdAndUpdate(req.params.user_id, req.body, { new: true });
        if (!user) {
            res.status(404).send({
                message: 'Product not found'
            });
        } else {
            res.json({
                message: 'Product Info updated',
                data: user
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};

// Handle delete user
exports.delete = async (req, res) => {
    try {
        const user = await Product.findByIdAndRemove(req.params.user_id);
        if (!user) {
            res.status(404).send({
                message: 'User not found'
            });
        } else {
            res.json({
                status: "success",
                message: 'User deleted'
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
};
