const express = require('express');
const router = express.Router();
const { getTopProducts, getUserSummary, getDashboardStats, getAllOrders } = require('../controllers/adminController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/top-products', authMiddleware, adminOnly, getTopProducts);
router.get('/user-summary', authMiddleware, adminOnly, getUserSummary);
router.get('/stats', authMiddleware, adminOnly, getDashboardStats);
router.get('/orders', authMiddleware, adminOnly, getAllOrders);

module.exports = router;
