const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');



// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/Product.routes');
const notesRoutes = require('./routes/notesRoutes.routes');

// Import middleware
const authMiddleware = require('./middleware/auth.middleware');

// Initialize express app
const app = express();

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }));

// Set views folder
app.set("view engine", "hbs"); // Assuming you're using Handlebars
app.set("views", path.join(__dirname, "views"));


// Set partials folder
var hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Middlewares
app.use(express.json()); // for parsing application/json

let DB = process.env.DB;
mongoose.set("strictQuery", true);

// Connect to MongoDB
mongoose.connect(DB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err) => {
    if (err) {
      console.error('Failed to connect to MongoDB', err);
    } else {
      console.log('Connected to MongoDB');
    }
  }
);

console.log("Fix Ths ============");
// Routes
app.use('/', notesRoutes);
// app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/products', userRoutes);


// Handle not found routes
app.use((req, res, next) => {
  res.status(404).send('Sorry, that route does not exist.');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
