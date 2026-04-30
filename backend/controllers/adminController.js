const db = require('../config/db');

// GET /admin/top-products  — uses the vw_top_products view
const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [products] = await db.query(
      'SELECT * FROM vw_top_products LIMIT ?',
      [limit]
    );
    return res.json({ success: true, products });
  } catch (err) {
    console.error('GetTopProducts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /admin/user-summary  — uses the vw_user_summary view
const getUserSummary = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM vw_user_summary ORDER BY total_spent DESC');
    return res.json({ success: true, users });
  } catch (err) {
    console.error('GetUserSummary error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /admin/stats  — dashboard overview numbers
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

    return res.json({
      success: true,
      stats: {
        total_revenue:  revenue.total_revenue,
        total_orders:   revenue.total_orders,
        total_users:    users.total_users,
        total_products: products.total_products,
        low_stock:      lowStock.low_stock_count
      }
    });
  } catch (err) {
    console.error('GetDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /admin/orders  — all orders with user info
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.order_id, o.status, o.total_amount, o.created_at,
              u.name AS user_name, u.email,
              p.method AS payment_method, p.status AS payment_status
       FROM Orders o
       JOIN Users   u ON u.user_id  = o.user_id
       LEFT JOIN Payments p ON p.order_id = o.order_id
       ORDER BY o.created_at DESC
       LIMIT 100`
    );
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('GetAllOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PUT /admin/orders/:id/status
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

module.exports = { getTopProducts, getUserSummary, getDashboardStats, getAllOrders, updateOrderStatus };
