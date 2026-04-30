const express = require('express');
const router = express.Router();
const { placeOrder, getOrders, getOrderById, getAddresses, addAddress, validateCoupon } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

router.post('/place',           authMiddleware, placeOrder);
router.post('/validate-coupon', authMiddleware, validateCoupon);
router.get('/',                 authMiddleware, getOrders);
router.get('/addresses',        authMiddleware, getAddresses);
router.post('/addresses',       authMiddleware, addAddress);
router.get('/:id',              authMiddleware, getOrderById);

module.exports = router;
