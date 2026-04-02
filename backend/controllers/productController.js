const db = require('../config/db');

// GET /products
const getProducts = async (req, res) => {
  try {
    const { category, search, min_price, max_price, sort } = req.query;

    let sql = `
      SELECT p.product_id, p.name, p.description, p.price, p.image_url, p.brand,
             c.name AS category, c.category_id,
             i.quantity AS stock,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(DISTINCT r.review_id) AS review_count
      FROM Products p
      LEFT JOIN Categories  c ON c.category_id = p.category_id
      LEFT JOIN Inventory   i ON i.product_id  = p.product_id
      LEFT JOIN Reviews     r ON r.product_id  = p.product_id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (min_price) {
      sql += ' AND p.price >= ?';
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      sql += ' AND p.price <= ?';
      params.push(parseFloat(max_price));
    }

    sql += ' GROUP BY p.product_id, p.name, p.description, p.price, p.image_url, p.brand, c.name, c.category_id, i.quantity';

    const sortMap = {
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      rating:     'avg_rating DESC',
      newest:     'p.created_at DESC',
    };
    sql += ` ORDER BY ${sortMap[sort] || 'p.product_id ASC'}`;

    const [products] = await db.query(sql, params);
    return res.json({ success: true, products });
  } catch (err) {
    console.error('GetProducts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category, i.quantity AS stock,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.review_id) AS review_count
       FROM Products p
       LEFT JOIN Categories c ON c.category_id = p.category_id
       LEFT JOIN Inventory  i ON i.product_id  = p.product_id
       LEFT JOIN Reviews    r ON r.product_id  = p.product_id
       WHERE p.product_id = ? AND p.is_active = 1
       GROUP BY p.product_id, c.name, i.quantity`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Fetch reviews separately
    const [reviews] = await db.query(
      `SELECT r.rating, r.title, r.body, r.created_at, u.name AS reviewer
       FROM Reviews r JOIN Users u ON u.user_id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [id]
    );

    return res.json({ success: true, product: rows[0], reviews });
  } catch (err) {
    console.error('GetProductById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT category_id, name, description, parent_id FROM Categories ORDER BY name'
    );
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('GetCategories error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getProducts, getProductById, getCategories };
