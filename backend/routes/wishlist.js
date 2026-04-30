const express = require('express');
const router  = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, moveToCart, getWishlistIds } = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',              getWishlist);
router.get('/ids',           getWishlistIds);
router.post('/add',          addToWishlist);
router.delete('/remove',     removeFromWishlist);
router.post('/move-to-cart', moveToCart);

module.exports = router;
