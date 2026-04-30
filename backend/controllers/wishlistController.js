const db = require('../config/db');

// GET /wishlist
const getWishlist = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT w.product_id, p.name, p.price, p.image_url, p.brand,
              c.name AS category, i.quantity AS stock,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(r.review_id)          AS review_count
       FROM Wishlist w
       JOIN Products  p ON p.product_id  = w.product_id
       LEFT JOIN Categories c ON c.category_id = p.category_id
       LEFT JOIN Inventory  i ON i.product_id  = w.product_id
       LEFT JOIN Reviews    r ON r.product_id  = w.product_id
       WHERE w.user_id = ?
       GROUP BY w.product_id, p.name, p.price, p.image_url, p.brand, c.name, i.quantity`,
      [req.user.user_id]
    );
    return res.json({ success: true, wishlist: items });
  } catch (err) {
    console.error('GetWishlist error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /wishlist/add
const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    // Verify product exists
    const [prod] = await db.query('SELECT product_id FROM Products WHERE product_id = ? AND is_active = 1', [product_id]);
    if (prod.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    await db.query(
      'INSERT IGNORE INTO Wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.user_id, product_id]
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
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    await db.query('DELETE FROM Wishlist WHERE user_id = ? AND product_id = ?', [req.user.user_id, product_id]);
    return res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('RemoveFromWishlist error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /wishlist/move-to-cart  — move one item from wishlist → cart
const moveToCart = async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    // Check stock
    const [inv] = await db.query('SELECT quantity FROM Inventory WHERE product_id = ?', [product_id]);
    if (inv.length === 0 || inv[0].quantity < 1) {
      return res.status(400).json({ success: false, message: 'Product out of stock.' });
    }

    // Get or create cart
    let [carts] = await db.query('SELECT cart_id FROM Cart WHERE user_id = ?', [req.user.user_id]);
    let cartId;
    if (carts.length > 0) {
      cartId = carts[0].cart_id;
    } else {
      const [result] = await db.query('INSERT INTO Cart (user_id) VALUES (?)', [req.user.user_id]);
      cartId = result.insertId;
    }

    // Upsert into cart
    await db.query(
      `INSERT INTO Cart_Items (cart_id, product_id, quantity) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [cartId, product_id]
    );

    // Remove from wishlist
    await db.query('DELETE FROM Wishlist WHERE user_id = ? AND product_id = ?', [req.user.user_id, product_id]);

    return res.json({ success: true, message: 'Item moved to cart.' });
  } catch (err) {
    console.error('MoveToCart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /wishlist/ids  — returns array of product_ids in wishlist (for heart icon state)
const getWishlistIds = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT product_id FROM Wishlist WHERE user_id = ?', [req.user.user_id]);
    return res.json({ success: true, ids: rows.map(r => r.product_id) });
  } catch (err) {
    console.error('GetWishlistIds error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart, getWishlistIds };
