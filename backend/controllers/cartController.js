const db = require('../config/db');

// Helper: get or create cart for user
const getCartId = async (userId) => {
  const [rows] = await db.query('SELECT cart_id FROM Cart WHERE user_id = ?', [userId]);
  if (rows.length > 0) return rows[0].cart_id;
  const [result] = await db.query('INSERT INTO Cart (user_id) VALUES (?)', [userId]);
  return result.insertId;
};

// GET /cart
const getCart = async (req, res) => {
  try {
    const cartId = await getCartId(req.user.user_id);
    const [items] = await db.query(
      `SELECT ci.cart_item_id, ci.product_id, ci.quantity,
              p.name, p.price, p.image_url, p.brand,
              i.quantity AS stock,
              (ci.quantity * p.price) AS line_total
       FROM Cart_Items ci
       JOIN Products  p ON p.product_id  = ci.product_id
       JOIN Inventory i ON i.product_id  = ci.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    return res.json({ success: true, cart: { cart_id: cartId, items, subtotal: subtotal.toFixed(2) } });
  } catch (err) {
    console.error('GetCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /cart/add
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    // Check product & stock
    const [prod] = await db.query(
      'SELECT p.product_id, i.quantity AS stock FROM Products p JOIN Inventory i ON i.product_id = p.product_id WHERE p.product_id = ? AND p.is_active = 1',
      [product_id]
    );
    if (prod.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (prod[0].stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock.' });

    const cartId = await getCartId(req.user.user_id);

    // Upsert cart item
    await db.query(
      `INSERT INTO Cart_Items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, product_id, quantity]
    );

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
    if (!product_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'product_id and quantity are required.' });
    }

    const cartId = await getCartId(req.user.user_id);

    if (quantity <= 0) {
      await db.query('DELETE FROM Cart_Items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    await db.query(
      'UPDATE Cart_Items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cartId, product_id]
    );
    return res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    console.error('UpdateCartItem error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /cart/remove
const removeFromCart = async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    const cartId = await getCartId(req.user.user_id);
    await db.query('DELETE FROM Cart_Items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
    return res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    console.error('RemoveFromCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /cart/clear
const clearCart = async (req, res) => {
  try {
    const cartId = await getCartId(req.user.user_id);
    await db.query('DELETE FROM Cart_Items WHERE cart_id = ?', [cartId]);
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('ClearCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
