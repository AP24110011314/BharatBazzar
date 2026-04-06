const express = require('express');
const router = express.Router();
const { placeOrder, getOrders, getOrderById, getAddresses, addAddress } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

router.post('/place', authMiddleware, placeOrder);
router.get('/', authMiddleware, getOrders);
router.get('/addresses', authMiddleware, getAddresses);
router.post('/addresses', authMiddleware, addAddress);
router.get('/:id', authMiddleware, getOrderById);

module.exports = router;
