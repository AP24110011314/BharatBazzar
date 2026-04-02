const db = require('../config/db');

// POST /order/place  — calls PlaceOrder stored procedure
const placeOrder = async (req, res) => {
  try {
    const { address_id, coupon_code = '', payment_method = 'upi', payment_provider = 'Demo' } = req.body;
    const userId = req.user.user_id;

    if (!address_id) {
      return res.status(400).json({ success: false, message: 'address_id is required.' });
    }

    // Call PlaceOrder stored procedure
    const [result] = await db.query(
      'CALL PlaceOrder(?, ?, ?, @orderId, @msg)',
      [userId, address_id, coupon_code]
    );

    const [[outParams]] = await db.query('SELECT @orderId AS order_id, @msg AS message');
    const { order_id, message } = outParams;

    if (!order_id || order_id === 0) {
      return res.status(400).json({ success: false, message });
    }

    // Auto-process payment via stored procedure
    await db.query(
      'CALL ProcessPayment(?, ?, ?, @payId, @payMsg)',
      [order_id, payment_method, payment_provider]
    );
    const [[payParams]] = await db.query('SELECT @payId AS payment_id, @payMsg AS pay_message');

    return res.status(201).json({
      success: true,
      message: 'Order placed and payment processed successfully.',
      order_id,
      payment_id: payParams.payment_id,
      payment_message: payParams.pay_message,
    });
  } catch (err) {
    console.error('PlaceOrder error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
  }
};

// GET /orders   — order history for current user
const getOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [orders] = await db.query(
      `SELECT o.order_id, o.status, o.subtotal, o.discount, o.total_amount, o.created_at,
              a.street, a.city, a.state, a.zip,
              p.method AS payment_method, p.status AS payment_status, p.transaction_ref
       FROM Orders  o
       LEFT JOIN Addresses a ON a.address_id = o.address_id
       LEFT JOIN Payments  p ON p.order_id   = o.order_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Enrich each order with its line items
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.unit_price, p.name, p.image_url,
                (oi.quantity * oi.unit_price) AS line_total
         FROM Order_Items oi JOIN Products p ON p.product_id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    return res.json({ success: true, orders });
  } catch (err) {
    console.error('GetOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /orders/:id  — single order detail
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId  = req.user.user_id;

    const [rows] = await db.query(
      `SELECT o.*, a.street, a.city, a.state, a.zip, a.country,
              p.method AS payment_method, p.status AS payment_status,
              p.transaction_ref, p.paid_at
       FROM Orders o
       LEFT JOIN Addresses a ON a.address_id = o.address_id
       LEFT JOIN Payments  p ON p.order_id   = o.order_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query(
      `SELECT oi.quantity, oi.unit_price, p.name, p.image_url, p.brand
       FROM Order_Items oi JOIN Products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.json({ success: true, order: { ...rows[0], items } });
  } catch (err) {
    console.error('GetOrderById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /addresses  — list user addresses
const getAddresses = async (req, res) => {
  try {
    const [addresses] = await db.query(
      'SELECT * FROM Addresses WHERE user_id = ? ORDER BY is_default DESC',
      [req.user.user_id]
    );
    return res.json({ success: true, addresses });
  } catch (err) {
    console.error('GetAddresses error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /addresses  — add address
const addAddress = async (req, res) => {
  try {
    const { label = 'Home', street, city, state, zip, country = 'India', is_default = 0 } = req.body;
    if (!street || !city || !state || !zip) {
      return res.status(400).json({ success: false, message: 'street, city, state, zip are required.' });
    }

    if (is_default) {
      await db.query('UPDATE Addresses SET is_default = 0 WHERE user_id = ?', [req.user.user_id]);
    }

    const [result] = await db.query(
      'INSERT INTO Addresses (user_id, label, street, city, state, zip, country, is_default) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.user_id, label, street, city, state, zip, country, is_default ? 1 : 0]
    );

    return res.status(201).json({ success: true, address_id: result.insertId, message: 'Address added.' });
  } catch (err) {
    console.error('AddAddress error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { placeOrder, getOrders, getOrderById, getAddresses, addAddress };
