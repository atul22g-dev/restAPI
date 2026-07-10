const Product = require('../models/Product.model');
const { asyncHandler } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Get all products
// @route   GET /api/products
/**
 * Build a MongoDB query object from URL query parameters.
 * Supports simple filters (featured, company, search) and
 * numeric comparison operators: price[gt], price[gte], price[lt], price[lte],
 * rating[gt], rating[gte], rating[lt], rating[lte].
 */
function buildQueryObject(query) {
  const queryObject = {};

  // Boolean / enum filters
  if (query.featured) queryObject.featured = query.featured === 'true';
  if (query.company) queryObject.company = query.company;
  if (query.search) queryObject.name = { $regex: query.search, $options: 'i' };

  // Numeric comparison operators (e.g. price[gt]=100, rating[gte]=4)
  const numericFields = ['price', 'rating'];
  const operators = {
    gt: '$gt',
    gte: '$gte',
    lt: '$lt',
    lte: '$lte',
  };

  numericFields.forEach((field) => {
    const opKeys = Object.keys(operators);
    let hasOperator = false;

    opKeys.forEach((op) => {
      const key = `${field}[${op}]`;
      if (query[key] !== undefined) {
        if (!queryObject[field]) queryObject[field] = {};
        queryObject[field][operators[op]] = Number(query[key]);
        hasOperator = true;
      }
    });

    // If no operator but a direct value is given, use exact match
    if (!hasOperator && query[field] !== undefined) {
      queryObject[field] = Number(query[field]);
    }
  });

  return queryObject;
}

// @desc    Get all products
// @route   GET /api/products
exports.index = asyncHandler(async (req, res) => {
  const { sort, fields, page, limit } = req.query;
  const queryObject = buildQueryObject(req.query);

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
