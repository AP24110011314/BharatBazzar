const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');

// Initialize MongoDB Atlas connection
require('./config/db');

const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const adminRoutes    = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes   = require('./routes/reviews');

const app = express();

// ── Production CORS Setup ──────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Automatically permit any Vercel deployment preview / production domain
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('.vercel.app') || hostname === 'localhost') {
        return callback(null, true);
      }
    } catch (e) {}

    // Permissive fallback so cross-origin deployments on Render/Vercel never get blocked
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ── Serve Frontend Static Files (if present in directory) ──────
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews',  reviewRoutes);

// ── Config & Diagnostic Endpoints ──────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    port: process.env.PORT || 5001,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Render / Kubernetes / Cloud Health Checks
app.get(['/health', '/healthz', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'BharatBazzar REST API',
    database: 'MongoDB Atlas Cloud',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Directory on root if accessed directly (e.g. on Render service URL)
app.get('/', (req, res, next) => {
  if (fs.existsSync(path.join(frontendPath, 'index.html')) && req.accepts('html')) {
    return next();
  }
  res.json({
    name: 'BharatBazzar API Service',
    description: 'Artisanal Indian Handicrafts E-Commerce Backend',
    status: 'online',
    version: '2.5.0',
    database: 'MongoDB Atlas Cloud',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      orders: '/api/orders',
      auth: '/api/auth',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      admin: '/api/admin'
    }
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🛒 BharatBazzar Backend running on port ${PORT}`);
  console.log(`🌐 Server available at http://localhost:${PORT}`);
});
