require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const adminRoutes    = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes   = require('./routes/reviews');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews',  reviewRoutes);

// Base route for status check
app.get('/', (req, res) => {
  res.send('BharatBazzar API is running...');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
