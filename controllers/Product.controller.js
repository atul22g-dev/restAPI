const Product = require('../models/Product.model');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Get all products
// @route   GET /api/products
exports.index = asyncHandler(async (req, res) => {
  const { featured, company, search, sort, fields, page, limit } = req.query;
  const queryObject = {};

  // Filtering
  if (featured) queryObject.featured = featured === 'true';
  if (company) queryObject.company = company;
  if (search) queryObject.name = { $regex: search, $options: "i" };

  let result = Product.find(queryObject);

  // Sorting
  if (sort) {
    const sortList = sort.split(',').join(' ');
    result = result.sort(sortList);
  } else {
    result = result.sort('-createdAt');
  }

  // Field selection
  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    result = result.select(fieldsList);
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;
  result = result.skip(skip).limit(limitNum);

  const products = await result;
  const total = await Product.countDocuments(queryObject);

  ApiResponse.success(res, {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  }, 'Products retrieved successfully');
});

// @desc    Create a new product
// @route   POST /api/products
exports.new = asyncHandler(async (req, res) => {
  const { company, featured, name, price, rating } = req.body;

  const product = await Product.create({
    company,
    featured,
    name,
    price,
    rating,
  });

  ApiResponse.created(res, product, 'Product created successfully');
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
exports.view = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Product not found',
    });
  }

  ApiResponse.success(res, product, 'Product retrieved successfully');
});

// @desc    Update a product
// @route   PUT /api/products/:id
exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Product not found',
    });
  }

  ApiResponse.success(res, product, 'Product updated successfully');
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
exports.delete = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Product not found',
    });
  }

  ApiResponse.success(res, null, 'Product deleted successfully');
});
