const express = require('express');
const router  = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',          getCart);
router.post('/add',      addToCart);
router.put('/update',    updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear',  clearCart);

module.exports = router;
