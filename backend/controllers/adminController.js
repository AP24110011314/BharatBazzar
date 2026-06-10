const db = require('../config/db');

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

const getDashboardStats = async (req, res) => {
  try {
    const [[revenue]]  = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total_revenue,
              COUNT(*) AS total_orders
       FROM Orders WHERE status != 'cancelled'`
    );
    const [[users]]    = await db.query('SELECT COUNT(*) AS total_users FROM Users WHERE role = "customer"');
    const [[products]] = await db.query('SELECT COUNT(*) AS total_products FROM Products WHERE is_active = 1');
    const [[lowStock]] = await db.query(
      'SELECT COUNT(*) AS low_stock_count FROM Inventory WHERE quantity < 10'
    );
    const [[coupons]]  = await db.query('SELECT COUNT(*) AS total_coupons FROM Coupons WHERE is_active = 1');
    const [[categories]] = await db.query('SELECT COUNT(*) AS total_categories FROM Categories');

    return res.json({
      success: true,
      stats: {
        total_revenue:    revenue.total_revenue,
        total_orders:     revenue.total_orders,
        total_users:      users.total_users,
        total_products:   products.total_products,
        low_stock:        lowStock.low_stock_count,
        total_coupons:    coupons.total_coupons,
        total_categories: categories.total_categories
      }
    });
  } catch (err) {
    console.error('GetDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════════

const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.order_id, o.status, o.total_amount, o.subtotal, o.discount, o.created_at,
              u.name AS user_name, u.email,
              p.method AS payment_method, p.status AS payment_status
       FROM Orders o
       JOIN Users   u ON u.user_id  = o.user_id
       LEFT JOIN Payments p ON p.order_id = o.order_id
       ORDER BY o.created_at DESC
       LIMIT 200`
    );
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('GetAllOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const [result] = await db.query(
      'UPDATE Orders SET status = ? WHERE order_id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({ success: true, message: `Order #${id} status updated to ${status}.` });
  } catch (err) {
    console.error('UpdateOrderStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Order + user + address
    const [orderRows] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email, u.phone,
              a.label AS address_label, a.street, a.city, a.state, a.zip, a.country
       FROM Orders o
       JOIN Users u ON u.user_id = o.user_id
       LEFT JOIN Addresses a ON a.address_id = o.address_id
       WHERE o.order_id = ?`,
      [id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Order items
    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image_url, p.brand
       FROM Order_Items oi
       JOIN Products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    // Payment
    const [payments] = await db.query(
      'SELECT * FROM Payments WHERE order_id = ?',
      [id]
    );

    return res.json({
      success: true,
      order: orderRows[0],
      items,
      payment: payments[0] || null
    });
  } catch (err) {
    console.error('GetOrderDetails error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PRODUCTS — full CRUD
// ═══════════════════════════════════════════════════════════════

const getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.product_id, p.name, p.description, p.price, p.image_url, p.brand,
              p.is_active, p.created_at, p.category_id,
              c.name AS category,
              COALESCE(i.quantity, 0) AS stock,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.review_id) AS review_count
       FROM Products p
       LEFT JOIN Categories c ON c.category_id = p.category_id
       LEFT JOIN Inventory  i ON i.product_id  = p.product_id
       LEFT JOIN Reviews    r ON r.product_id  = p.product_id
       GROUP BY p.product_id
       ORDER BY p.product_id DESC`
    );
    return res.json({ success: true, products });
  } catch (err) {
    console.error('GetAllProducts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url, brand, category_id, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO Products (name, description, price, image_url, brand, category_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, description || null, parseFloat(price), image_url || null, brand || null, category_id || null]
    );

    const productId = result.insertId;

    // Create inventory entry
    await db.query(
      'INSERT INTO Inventory (product_id, quantity) VALUES (?, ?)',
      [productId, parseInt(stock) || 0]
    );

    return res.status(201).json({ success: true, message: 'Product created successfully.', product_id: productId });
  } catch (err) {
    console.error('CreateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, brand, category_id, is_active } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined)        { fields.push('name = ?');        values.push(name); }
    if (description !== undefined)  { fields.push('description = ?'); values.push(description); }
    if (price !== undefined)       { fields.push('price = ?');       values.push(parseFloat(price)); }
    if (image_url !== undefined)   { fields.push('image_url = ?');   values.push(image_url); }
    if (brand !== undefined)       { fields.push('brand = ?');       values.push(brand); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id || null); }
    if (is_active !== undefined)   { fields.push('is_active = ?');   values.push(is_active ? 1 : 0); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE Products SET ${fields.join(', ')} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('UpdateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft-delete: set is_active = 0
    const [result] = await db.query(
      'UPDATE Products SET is_active = 0 WHERE product_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, message: 'Product deactivated successfully.' });
  } catch (err) {
    console.error('DeleteProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  TOP PRODUCTS — analytics view
// ═══════════════════════════════════════════════════════════════

const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [products] = await db.query(
      `SELECT p.product_id, p.name AS product_name, p.price, p.image_url,
              c.name AS category,
              COALESCE(i.quantity, 0) AS stock_remaining,
              COALESCE(SUM(oi.quantity), 0) AS total_sold,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
              COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM Products p
       LEFT JOIN Categories c  ON c.category_id = p.category_id
       LEFT JOIN Inventory  i  ON i.product_id  = p.product_id
       LEFT JOIN Order_Items oi ON oi.product_id = p.product_id
       LEFT JOIN Reviews    r  ON r.product_id  = p.product_id
       WHERE p.is_active = 1
       GROUP BY p.product_id
       HAVING total_sold > 0
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    return res.json({ success: true, products });
  } catch (err) {
    console.error('GetTopProducts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════════

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
    }

    // Upsert — if inventory row doesn't exist, create it
    const [existing] = await db.query('SELECT * FROM Inventory WHERE product_id = ?', [id]);
    if (existing.length === 0) {
      await db.query('INSERT INTO Inventory (product_id, quantity) VALUES (?, ?)', [id, parseInt(quantity)]);
    } else {
      await db.query('UPDATE Inventory SET quantity = ? WHERE product_id = ?', [parseInt(quantity), id]);
    }

    return res.json({ success: true, message: `Stock updated to ${quantity} units.` });
  } catch (err) {
    console.error('UpdateInventory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES — full CRUD
// ═══════════════════════════════════════════════════════════════

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT c.*, 
              p.name AS parent_name,
              (SELECT COUNT(*) FROM Products WHERE category_id = c.category_id AND is_active = 1) AS product_count
       FROM Categories c
       LEFT JOIN Categories p ON p.category_id = c.parent_id
       ORDER BY c.name`
    );
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('GetAllCategories error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [result] = await db.query(
      'INSERT INTO Categories (name, description, parent_id) VALUES (?, ?, ?)',
      [name, description || null, parent_id || null]
    );

    return res.status(201).json({ success: true, message: 'Category created.', category_id: result.insertId });
  } catch (err) {
    console.error('CreateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const fields = [];
    const values = [];
    if (name !== undefined)       { fields.push('name = ?');       values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (parent_id !== undefined)  { fields.push('parent_id = ?');  values.push(parent_id || null); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE Categories SET ${fields.join(', ')} WHERE category_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    console.error('UpdateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if products use this category
    const [[check]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM Products WHERE category_id = ? AND is_active = 1',
      [id]
    );
    if (check.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${check.cnt} active product(s) use this category. Reassign them first.`
      });
    }

    const [result] = await db.query('DELETE FROM Categories WHERE category_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('DeleteCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  COUPONS — full CRUD
// ═══════════════════════════════════════════════════════════════

const getAllCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM Coupons ORDER BY coupon_id DESC');
    return res.json({ success: true, coupons });
  } catch (err) {
    console.error('GetAllCoupons error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amt, max_uses } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ success: false, message: 'Code, type, and value are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO Coupons (code, discount_type, discount_value, min_order_amt, max_uses, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [code.toUpperCase(), discount_type, parseFloat(discount_value), parseFloat(min_order_amt) || 0, parseInt(max_uses) || null]
    );

    return res.status(201).json({ success: true, message: 'Coupon created.', coupon_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }
    console.error('CreateCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discount_type, discount_value, min_order_amt, max_uses } = req.body;

    const fields = [];
    const values = [];
    if (code !== undefined)           { fields.push('code = ?');           values.push(code.toUpperCase()); }
    if (discount_type !== undefined)  { fields.push('discount_type = ?');  values.push(discount_type); }
    if (discount_value !== undefined) { fields.push('discount_value = ?'); values.push(parseFloat(discount_value)); }
    if (min_order_amt !== undefined)  { fields.push('min_order_amt = ?');  values.push(parseFloat(min_order_amt)); }
    if (max_uses !== undefined)       { fields.push('max_uses = ?');       values.push(max_uses ? parseInt(max_uses) : null); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE Coupons SET ${fields.join(', ')} WHERE coupon_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    return res.json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }
    console.error('UpdateCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      'UPDATE Coupons SET is_active = NOT is_active WHERE coupon_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    // Fetch updated state
    const [[coupon]] = await db.query('SELECT is_active FROM Coupons WHERE coupon_id = ?', [id]);
    const state = coupon.is_active ? 'activated' : 'deactivated';

    return res.json({ success: true, message: `Coupon ${state}.`, is_active: coupon.is_active });
  } catch (err) {
    console.error('ToggleCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════

const getUserSummary = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.role, u.created_at,
              COUNT(o.order_id) AS total_orders,
              COALESCE(SUM(o.total_amount), 0) AS total_spent
       FROM Users u
       LEFT JOIN Orders o ON u.user_id = o.user_id
       GROUP BY u.user_id
       ORDER BY total_spent DESC`
    );
    return res.json({ success: true, users });
  } catch (err) {
    console.error('GetUserSummary error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "customer" or "admin".' });
    }

    // Prevent self-demotion
    if (parseInt(id) === req.user.user_id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself.' });
    }

    const [result] = await db.query(
      'UPDATE Users SET role = ? WHERE user_id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: `User #${id} role changed to ${role}.` });
  } catch (err) {
    console.error('UpdateUserRole error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [result] = await db.query('DELETE FROM Users WHERE user_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: `User #${id} deleted.` });
  } catch (err) {
    console.error('DeleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Dashboard
  getDashboardStats,
  // Orders
  getAllOrders, updateOrderStatus, getOrderDetails,
  // Products
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getTopProducts,
  // Inventory
  updateInventory,
  // Categories
  getAllCategories, createCategory, updateCategory, deleteCategory,
  // Coupons
  getAllCoupons, createCoupon, updateCoupon, toggleCoupon,
  // Users
  getUserSummary, updateUserRole, deleteUser
};
