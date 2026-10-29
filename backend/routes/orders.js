const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrderById,
  getAddresses,
  addAddress,
  validateCoupon,
  createRazorpayOrder,
  verifyRazorpayOrder,
  cancelOrder,
  getPaymentConfig
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

// Payment gateway configuration
router.get('/payment-config', getPaymentConfig);

// Order creation & payment routes
router.post('/create-razorpay-order', authMiddleware, createRazorpayOrder);
router.post('/verify-razorpay',       authMiddleware, verifyRazorpayOrder);
router.post('/place',                 authMiddleware, placeOrder);
router.put('/:id/cancel',             authMiddleware, cancelOrder);

// Coupon & addresses
router.post('/validate-coupon', authMiddleware, validateCoupon);
router.get('/addresses',        authMiddleware, getAddresses);
router.post('/addresses',       authMiddleware, addAddress);

// Orders query
router.get('/',                 authMiddleware, getOrders);
router.get('/:id',              authMiddleware, getOrderById);

module.exports = router;
