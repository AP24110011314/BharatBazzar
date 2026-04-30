const db = require('../config/db');

// POST /api/reviews
const submitReview = async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body;
    const userId = req.user.user_id;

    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID and rating are required.' });
    }

    // Optional: Check if user purchased the product
    const [orders] = await db.query(
      `SELECT o.order_id 
       FROM Orders o 
       JOIN Order_Items oi ON oi.order_id = o.order_id 
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
      [userId, product_id]
    );

    // If you want to be strict, uncomment this. For a student project, maybe just check if they have an order.
    /*
    if (orders.length === 0) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received.' });
    }
    */

    // Upsert review (using INSERT ... ON DUPLICATE KEY UPDATE)
    await db.query(
      `INSERT INTO Reviews (product_id, user_id, rating, title, body)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), body = VALUES(body)`,
      [product_id, userId, rating, title, body]
    );

    return res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('SubmitReview error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/reviews/user
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [reviews] = await db.query(
      `SELECT r.*, p.name AS product_name, p.image_url 
       FROM Reviews r 
       JOIN Products p ON p.product_id = r.product_id 
       WHERE r.user_id = ? 
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, reviews });
  } catch (err) {
    console.error('GetUserReviews error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { submitReview, getUserReviews };
