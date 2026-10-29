const Wishlist  = require('../models/Wishlist');
const Product   = require('../models/Product');
const Category  = require('../models/Category');
const Inventory = require('../models/Inventory');
const Review    = require('../models/Review');
const Cart      = require('../models/Cart');
const { getNextSequence } = require('../models/Counter');

// GET /wishlist
const getWishlist = async (req, res) => {
  try {
    const list = await Wishlist.find({ user_id: req.user.user_id }).lean();
    const productIds = list.map(w => w.product_id);

    const products = await Product.find({ product_id: { $in: productIds } }).lean();
    const categories = await Category.find({}).lean();
    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.name; });

    const inventories = await Inventory.find({ product_id: { $in: productIds } }).lean();
    const invMap = {};
    inventories.forEach(i => { invMap[i.product_id] = i.quantity; });

    const reviews = await Review.find({ product_id: { $in: productIds } }).lean();
    const reviewStats = {};
    reviews.forEach(r => {
      if (!reviewStats[r.product_id]) reviewStats[r.product_id] = { total: 0, count: 0 };
      reviewStats[r.product_id].total += r.rating;
      reviewStats[r.product_id].count += 1;
    });

    const items = products.map(p => {
      const stats = reviewStats[p.product_id] || { total: 0, count: 0 };
      return {
        product_id: p.product_id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        brand: p.brand,
        category: catMap[p.category_id] || 'General',
        stock: invMap[p.product_id] !== undefined ? invMap[p.product_id] : 0,
        avg_rating: stats.count > 0 ? parseFloat((stats.total / stats.count).toFixed(2)) : 0,
        review_count: stats.count
      };
    });

    return res.json({ success: true, wishlist: items, items: items });
  } catch (err) {
    console.error('GetWishlist error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /wishlist/ids
const getWishlistIds = async (req, res) => {
  try {
    const rows = await Wishlist.find({ user_id: req.user.user_id }).select('product_id').lean();
    return res.json({ success: true, ids: rows.map(r => r.product_id) });
  } catch (err) {
    console.error('GetWishlistIds error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /wishlist/add
const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    const prodId = parseInt(product_id);
    if (!prodId) return res.status(400).json({ success: false, message: 'product_id is required.' });

    const prod = await Product.findOne({ product_id: prodId, is_active: true });
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    await Wishlist.updateOne(
      { user_id: req.user.user_id, product_id: prodId },
      { $setOnInsert: { user_id: req.user.user_id, product_id: prodId } },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Added to wishlist.' });
  } catch (err) {
    console.error('AddToWishlist error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /wishlist/remove
const removeFromWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    const prodId = parseInt(product_id);
    if (!prodId) return res.status(400).json({ success: false, message: 'product_id is required.' });

    await Wishlist.deleteOne({ user_id: req.user.user_id, product_id: prodId });
    return res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('RemoveFromWishlist error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /wishlist/move-to-cart
const moveToCart = async (req, res) => {
  try {
    const { product_id } = req.body;
    const prodId = parseInt(product_id);
    if (!prodId) return res.status(400).json({ success: false, message: 'product_id is required.' });

    const inv = await Inventory.findOne({ product_id: prodId });
    if (!inv || inv.quantity < 1) {
      return res.status(400).json({ success: false, message: 'Product out of stock.' });
    }

    let cart = await Cart.findOne({ user_id: req.user.user_id });
    if (!cart) {
      const cartId = await getNextSequence('cart_id');
      cart = await Cart.create({ cart_id: cartId, user_id: req.user.user_id, items: [] });
    }

    const idx = cart.items.findIndex(i => i.product_id === prodId);
    if (idx > -1) {
      cart.items[idx].quantity += 1;
    } else {
      const cartItemId = await getNextSequence('cart_item_id');
      cart.items.push({ cart_item_id: cartItemId, product_id: prodId, quantity: 1 });
    }
    await cart.save();

    await Wishlist.deleteOne({ user_id: req.user.user_id, product_id: prodId });

    return res.json({ success: true, message: 'Item moved to cart.' });
  } catch (err) {
    console.error('MoveToCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart, getWishlistIds };
