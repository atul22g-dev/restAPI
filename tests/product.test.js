const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Product = require('../models/Product.model');

// Setup connection to the database
beforeAll(async () => {
  const DB = process.env.DB || 'mongodb://localhost:27017/restapi_test';
  // Connect to MongoDB (mongodb-memory-server would be ideal, but using existing setup)
  await mongoose.connect(DB);
});

// Cleanup and disconnect after tests are finished
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clean products collection before each test
beforeEach(async () => {
  await Product.deleteMany({});
});

describe('Products API', () => {
  const sampleProduct = {
    name: 'iPhone 14',
    price: 999,
    featured: true,
    rating: 4.8,
    company: 'apple',
  };

  // Test GET /api/products - empty list
  it('should return empty products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data.products).toEqual([]);
  });

  // Test POST /api/products - create product
  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send(sampleProduct);
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.name).toEqual(sampleProduct.name);
    expect(res.body.data.price).toEqual(sampleProduct.price);
  });

  // Test GET /api/products - with data
  it('should retrieve all products', async () => {
    await Product.create(sampleProduct);
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
  });

  // Test GET /api/products/:id
  it('should retrieve a product by id', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.name).toEqual(sampleProduct.name);
  });

  // Test GET /api/products/:id - not found
  it('should return 404 for non-existent product id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.status).toEqual('error');
  });

  // Test PUT /api/products/:id
  it('should update a product', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .send({
        name: 'iPhone 15',
        price: 1099,
        company: 'apple',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data.name).toEqual('iPhone 15');
    expect(res.body.data.price).toEqual(1099);
  });

  // Test DELETE /api/products/:id
  it('should delete a product', async () => {
    const product = await Product.create(sampleProduct);
    const res = await request(app).delete(`/api/products/${product._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.message).toEqual('Product deleted successfully');

    // Verify deletion
    const deleted = await Product.findById(product._id);
    expect(deleted).toBeNull();
  });

  // Test validation - missing name
  it('should reject product without name', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ price: 999, company: 'apple' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual('error');
  });

  // Test validation - missing price
  it('should reject product without price', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test', company: 'apple' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual('error');
  });

  // Test validation - unsupported company
  it('should reject product with unsupported company', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test', price: 100, company: 'nokia' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual('error');
  });
});
