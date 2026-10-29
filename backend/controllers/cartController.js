const Cart      = require('../models/Cart');
const Product   = require('../models/Product');
const Inventory = require('../models/Inventory');
const { getNextSequence } = require('../models/Counter');

// Helper: get or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user_id: userId });
  if (!cart) {
    const cartId = await getNextSequence('cart_id');
    cart = await Cart.create({ cart_id: cartId, user_id: userId, items: [] });
  }
  return cart;
};

// GET /cart
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.user_id);

    // Fetch product and inventory info for all items
    const productIds = cart.items.map(i => i.product_id);
    const products = await Product.find({ product_id: { $in: productIds } }).lean();
    const inventories = await Inventory.find({ product_id: { $in: productIds } }).lean();

    const prodMap = {};
    products.forEach(p => { prodMap[p.product_id] = p; });

    const invMap = {};
    inventories.forEach(i => { invMap[i.product_id] = i.quantity; });

    const items = cart.items.map(item => {
      const prod = prodMap[item.product_id] || {};
      const price = prod.price || 0;
      const stock = invMap[item.product_id] !== undefined ? invMap[item.product_id] : 0;
      const lineTotal = (item.quantity * price).toFixed(2);

      return {
        cart_item_id: item.cart_item_id || item.product_id,
        product_id: item.product_id,
        quantity: item.quantity,
        name: prod.name || 'Unknown Item',
        price,
        image_url: prod.image_url || '',
        brand: prod.brand || '',
        stock,
        line_total: lineTotal
      };
    });

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);

    return res.json({
      success: true,
      cart: {
        cart_id: cart.cart_id,
        items,
        subtotal: subtotal.toFixed(2)
      },
      items,
      subtotal: subtotal.toFixed(2)
    });
  } catch (err) {
    console.error('GetCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /cart/add
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const prodId = parseInt(product_id);
    const addQty = parseInt(quantity) || 1;

    if (!prodId) return res.status(400).json({ success: false, message: 'product_id is required.' });

    // Check product & stock
    const prod = await Product.findOne({ product_id: prodId, is_active: true });
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    const inv = await Inventory.findOne({ product_id: prodId });
    const currentStock = inv ? inv.quantity : 0;

    const cart = await getOrCreateCart(req.user.user_id);
    const existingIndex = cart.items.findIndex(i => i.product_id === prodId);
    const currentQtyInCart = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;

    if (currentStock < currentQtyInCart + addQty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += addQty;
    } else {
      const cartItemId = await getNextSequence('cart_item_id');
      cart.items.push({ cart_item_id: cartItemId, product_id: prodId, quantity: addQty });
    }

    await cart.save();
    return res.json({ success: true, message: 'Item added to cart.' });
  } catch (err) {
    console.error('AddToCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PUT /cart/update
const updateCartItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const prodId = parseInt(product_id);
    const newQty = parseInt(quantity);

    if (!prodId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'product_id and quantity are required.' });
    }

    const cart = await getOrCreateCart(req.user.user_id);

    if (newQty <= 0) {
      cart.items = cart.items.filter(i => i.product_id !== prodId);
      await cart.save();
      return res.json({ success: true, message: 'Item removed from cart.', cart });
    }

    const inv = await Inventory.findOne({ product_id: prodId });
    const stock = inv ? inv.quantity : 0;
    if (stock < newQty) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    const item = cart.items.find(i => i.product_id === prodId);
    if (item) {
      item.quantity = newQty;
      await cart.save();
    }

    return res.json({ success: true, message: 'Cart updated.', cart });
  } catch (err) {
    console.error('UpdateCartItem error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /cart/remove or /cart/remove/:productId
const removeFromCart = async (req, res) => {
  try {
    const rawId = req.params.productId || req.body?.product_id;
    const prodId = parseInt(rawId);
    if (!prodId) return res.status(400).json({ success: false, message: 'product_id is required.' });

    const cart = await getOrCreateCart(req.user.user_id);
    cart.items = cart.items.filter(i => i.product_id !== prodId);
    await cart.save();

    return res.json({ success: true, message: 'Item removed from cart.', cart });
  } catch (err) {
    console.error('RemoveFromCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /cart/clear
const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.user_id);
    cart.items = [];
    await cart.save();
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('ClearCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
