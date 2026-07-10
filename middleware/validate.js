const { AppError } = require('./errorHandler');

/**
 * Validates product creation request body
 * - All required fields must be present
 */
const validateProductCreate = (req, _res, next) => {
  const { name, price, company } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Product name is required', 400));
  }

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return next(new AppError('Valid product price is required', 400));
  }

  const allowedCompanies = ['apple', 'samsung', 'dell', 'mi', 'asus'];
  if (company && !allowedCompanies.includes(company)) {
    return next(new AppError(`Company "${company}" is not supported`, 400));
  }

  next();
};

/**
 * Validates product update request body
 * - Partial updates allowed, only validates fields that are present
 */
const validateProductUpdate = (req, _res, next) => {
  const { name, price, company } = req.body;

  // If no fields provided, reject
  if (!Object.keys(req.body).length) {
    return next(new AppError('No fields provided for update', 400));
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return next(new AppError('Product name cannot be empty', 400));
  }

  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return next(new AppError('Valid product price is required', 400));
  }

  const allowedCompanies = ['apple', 'samsung', 'dell', 'mi', 'asus'];
  if (company && !allowedCompanies.includes(company)) {
    return next(new AppError(`Company "${company}" is not supported`, 400));
  }

  next();
};

module.exports = {
  validateProductCreate,
  validateProductUpdate,
};
