const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  let DB = process.env.DB;
  try {
    mongoose.set("strictQuery", true);
    // Connect to MongoDB
    mongoose.connect(DB,
      {
        useNewUrlParser: true,
      }
    );
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
