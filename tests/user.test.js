const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Product = require('../models/Product.model');

// Setup connection to the database
beforeAll(async () => {
  let DB = process.env.DB;
  mongoose.set("strictQuery", true);
  // Connect to MongoDB
  mongoose.connect( DB,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: process.env.DB_USER,
      pass: process.env.DB_PASS,
    }
  );
});

// Cleanup and disconnect after tests are finished
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('User API', () => {
  let token;

  // Create a mock user and get a token for authentication
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
      });
    token = response.body.token;
  });

  // Test the POST /api/users endpoint
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'johndoe',
        email: 'johndoe@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.username).toEqual('johndoe');
  });

  // Test the GET /api/users endpoint
  it('should retrieve all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });

  // Test the GET /api/users/:user_id endpoint
  it('should retrieve a user by id', async () => {
    const user = await Product.findOne({ username: 'testuser' });
    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.username).toEqual('testuser');
  });

  // Test the PUT /api/users/:user_id endpoint
  it('should update a user', async () => {
    const user = await User.findOne({ username: 'testuser' });
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'updateduser',
        email: 'updateduser@example.com',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.username).toEqual('updateduser');
  });

  // Test the DELETE /api/users/:user_id endpoint
  it('should delete a user', async () => {
    const user = await Product.findOne({ username: 'updateduser' });
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'User deleted');
  });
});
