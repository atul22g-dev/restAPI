const mongoose = require('mongoose');

const connectDB = async () => {
  const DB = process.env.DB;

  if (!DB) {
    console.error('MongoDB connection string (DB) is not set in environment variables');
    process.exit(1);
  }

  try {
    // Mongoose 8+ uses these as defaults: useNewUrlParser, useUnifiedTopology, strictQuery
    const conn = await mongoose.connect(DB);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

module.exports = connectDB;
