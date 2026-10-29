const crypto    = require('crypto');
const Order     = require('../models/Order');
const Cart      = require('../models/Cart');
const Product   = require('../models/Product');
const Inventory = require('../models/Inventory');
const Address   = require('../models/Address');
const Payment   = require('../models/Payment');
const Coupon    = require('../models/Coupon');
const { getNextSequence } = require('../models/Counter');
const { getRazorpayInstance } = require('../config/razorpay');

// Helper: Calculate totals, validate stock, and apply coupon
async function calculateCartTotals(cart, couponCode) {
  const prodIds = cart.items.map(i => i.product_id);
  const products = await Product.find({ product_id: { $in: prodIds }, is_active: true }).lean();
  const inventories = await Inventory.find({ product_id: { $in: prodIds } }).lean();

  const prodMap = {};
  products.forEach(p => { prodMap[p.product_id] = p; });

  const invMap = {};
  inventories.forEach(inv => { invMap[inv.product_id] = inv.quantity; });

  for (const item of cart.items) {
    const prod = prodMap[item.product_id];
    if (!prod) {
      throw new Error(`Product #${item.product_id} is no longer available.`);
    }
    const stock = invMap[item.product_id] || 0;
    if (stock < item.quantity) {
      throw new Error(`Insufficient stock for product "${prod.name}". Only ${stock} remaining.`);
    }
  }

  let subtotal = 0;
  const orderItems = [];
  for (const item of cart.items) {
    const prod = prodMap[item.product_id];
    const unitPrice = prod.price || 0;
    subtotal += (unitPrice * item.quantity);
    orderItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice
    });
  }

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode, is_active: true });
    if (coupon) {
      if (coupon.max_uses && (coupon.uses_count || 0) >= coupon.max_uses) {
        throw new Error('This coupon has reached its maximum usage limit.');
      }
      if (subtotal < coupon.min_order_amt) {
        throw new Error(`Minimum order amount for coupon ${cleanCode} is ₹${coupon.min_order_amt.toFixed(2)}.`);
      }
      if (coupon.discount_type === 'percent') {
        discount = subtotal * (coupon.discount_value / 100);
      } else {
        discount = coupon.discount_value;
      }
      discount = Math.min(discount, subtotal);
      appliedCoupon = coupon;
    }
  }

  const totalAmount = Math.max(0, subtotal - discount);
  return {
    prodMap,
    invMap,
    orderItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    appliedCoupon
  };
}

// GET /orders/payment-config
const getPaymentConfig = (req, res) => {
  return res.json({
    success: true,
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
    key_id: process.env.RAZORPAY_KEY_ID || '',
    currency: process.env.CURRENCY || 'INR'
  });
};

// POST /orders/create-razorpay-order
const createRazorpayOrder = async (req, res) => {
  try {
    const { address_id, coupon_code } = req.body;
    const userId = req.user.user_id;

    if (!address_id) {
      return res.status(400).json({ success: false, message: 'address_id is required.' });
    }

    const address = await Address.findOne({ address_id: parseInt(address_id), user_id: userId });
    if (!address) {
      return res.status(400).json({ success: false, message: 'Invalid or unauthorized delivery address.' });
    }

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const { subtotal, discount, totalAmount } = await calculateCartTotals(cart, coupon_code);

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured on the server. Please check environment variables.'
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const currency = process.env.CURRENCY || 'INR';

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${userId}_${Date.now()}`,
      notes: {
        user_id: String(userId),
        address_id: String(address_id),
        coupon_code: coupon_code || ''
      }
    });

    return res.json({
      success: true,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      subtotal,
      discount,
      total_amount: totalAmount
    });
  } catch (err) {
    console.error('CreateRazorpayOrder error:', err);
    const msg = err.error?.description || err.message || (typeof err === 'string' ? err : 'Failed to initialize Razorpay payment.');
    return res.status(400).json({ success: false, message: msg });
  }
};

// POST /orders/verify-razorpay
const verifyRazorpayOrder = async (req, res) => {
  try {
    const {
      address_id,
      coupon_code,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const userId = req.user.user_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment verification fields.' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Server Razorpay secret is missing.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: invalid signature. Transaction rejected.'
      });
    }

    const address = await Address.findOne({ address_id: parseInt(address_id), user_id: userId });
    if (!address) {
      return res.status(400).json({ success: false, message: 'Invalid or unauthorized delivery address.' });
    }

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const { prodMap, orderItems, subtotal, discount, totalAmount, appliedCoupon } = await calculateCartTotals(cart, coupon_code);

    // Atomically decrement inventory with rollback safety
    const deducted = [];
    for (const item of cart.items) {
      const inv = await Inventory.findOneAndUpdate(
        { product_id: item.product_id, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (!inv) {
        for (const d of deducted) {
          await Inventory.findOneAndUpdate(
            { product_id: d.product_id },
            { $inc: { quantity: d.quantity } }
          );
        }
        const prod = prodMap[item.product_id];
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${prod ? prod.name : item.product_id}".`
        });
      }
      deducted.push({ product_id: item.product_id, quantity: item.quantity });
    }

    // Create Order
    const orderId = await getNextSequence('order_id');
    const order = await Order.create({
      order_id: orderId,
      user_id: userId,
      address_id: parseInt(address_id),
      status: 'confirmed',
      subtotal,
      discount,
      total_amount: totalAmount,
      items: orderItems,
      created_at: new Date()
    });

    // Create Payment
    const paymentId = await getNextSequence('payment_id');
    await Payment.create({
      payment_id: paymentId,
      order_id: orderId,
      method: 'razorpay',
      status: 'completed',
      transaction_ref: razorpay_payment_id,
      provider: 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paid_at: new Date()
    });

    if (appliedCoupon) {
      await Coupon.updateOne({ code: appliedCoupon.code }, { $inc: { uses_count: 1 } });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order_id: orderId,
      payment_id: paymentId,
      transaction_ref: razorpay_payment_id,
      payment_message: `Paid ₹${totalAmount.toFixed(2)} via Razorpay`
    });
  } catch (err) {
    console.error('VerifyRazorpayOrder error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment verification failed.' });
  }
};

// POST /orders/validate-coupon
const validateCoupon = async (req, res) => {
  try {
    const rawCode = req.body.coupon_code || req.body.code;
    if (!rawCode || !rawCode.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const cleanCode = rawCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode, is_active: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (coupon.max_uses && (coupon.uses_count || 0) >= coupon.max_uses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    // Determine subtotal from explicit parameter or from active cart
    let subtotal = req.body.order_amount ? parseFloat(req.body.order_amount) : 0;
    if (!subtotal) {
      const cart = await Cart.findOne({ user_id: req.user.user_id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      const prodIds = cart.items.map(i => i.product_id);
      const products = await Product.find({ product_id: { $in: prodIds } }).lean();
      const prodMap = {};
      products.forEach(p => { prodMap[p.product_id] = p; });

      cart.items.forEach(i => {
        const p = prodMap[i.product_id];
        if (p) subtotal += (p.price * i.quantity);
      });
    }

    if (subtotal < coupon.min_order_amt) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₹${coupon.min_order_amt.toFixed(2)}.`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = subtotal * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, subtotal);

    return res.json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon_code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: parseFloat(discount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      total_after_discount: parseFloat((subtotal - discount).toFixed(2))
    });
  } catch (err) {
    console.error('ValidateCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /orders/place
const placeOrder = async (req, res) => {
  try {
    const { address_id, coupon_code = '', payment_method = 'upi', payment_provider = 'BharatBazzar Pay' } = req.body;
    const userId = req.user.user_id;

    if (!address_id) {
      return res.status(400).json({ success: false, message: 'address_id is required.' });
    }

    const address = await Address.findOne({ address_id: parseInt(address_id), user_id: userId });
    if (!address) {
      return res.status(400).json({ success: false, message: 'Invalid or unauthorized delivery address.' });
    }

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const { prodMap, orderItems, subtotal, discount, totalAmount, appliedCoupon } = await calculateCartTotals(cart, coupon_code);

    // Atomically decrement inventory with rollback safety
    const deducted = [];
    for (const item of cart.items) {
      const inv = await Inventory.findOneAndUpdate(
        { product_id: item.product_id, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (!inv) {
        for (const d of deducted) {
          await Inventory.findOneAndUpdate(
            { product_id: d.product_id },
            { $inc: { quantity: d.quantity } }
          );
        }
        const prod = prodMap[item.product_id];
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${prod ? prod.name : item.product_id}".`
        });
      }
      deducted.push({ product_id: item.product_id, quantity: item.quantity });
    }

    // Create Order
    const orderId = await getNextSequence('order_id');
    const order = await Order.create({
      order_id: orderId,
      user_id: userId,
      address_id: parseInt(address_id),
      status: 'confirmed',
      subtotal,
      discount,
      total_amount: totalAmount,
      items: orderItems,
      created_at: new Date()
    });

    // Create Payment
    const isCod = payment_method === 'cod';
    const paymentId = await getNextSequence('payment_id');
    const txRef = isCod ? `COD-${Date.now()}` : `TXN-${crypto.randomUUID()}`;
    const providerName = isCod ? 'Cash on Delivery' : payment_provider;
    const paymentStatus = isCod ? 'pending' : 'completed';

    await Payment.create({
      payment_id: paymentId,
      order_id: orderId,
      method: payment_method,
      status: paymentStatus,
      transaction_ref: txRef,
      provider: providerName,
      paid_at: isCod ? null : new Date()
    });

    if (appliedCoupon) {
      await Coupon.updateOne({ code: appliedCoupon.code }, { $inc: { uses_count: 1 } });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: isCod ? 'Order confirmed! Pay cash on delivery.' : 'Order placed and payment processed successfully.',
      order_id: orderId,
      payment_id: paymentId,
      payment_message: isCod ? 'Cash on Delivery' : 'Payment successful',
      transaction_ref: txRef
    });
  } catch (err) {
    console.error('PlaceOrder error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Internal server error.' });
  }
};

// PUT /orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.user_id;

    const order = await Order.findOne({ order_id: id, user_id: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${order.status}. Please contact support.`
      });
    }

    // Restore stock
    for (const item of order.items || []) {
      await Inventory.findOneAndUpdate(
        { product_id: item.product_id },
        { $inc: { quantity: item.quantity } }
      );
    }

    order.status = 'cancelled';
    await order.save();

    await Payment.findOneAndUpdate(
      { order_id: id },
      { status: 'refunded' }
    );

    return res.json({
      success: true,
      message: `Order #${id} has been cancelled and stock restored to inventory.`
    });
  } catch (err) {
    console.error('CancelOrder error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /orders
const getOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orders = await Order.find({ user_id: userId }).sort({ created_at: -1 }).lean();

    const addressIds = orders.map(o => o.address_id).filter(Boolean);
    const orderIds = orders.map(o => o.order_id);

    const addresses = await Address.find({ address_id: { $in: addressIds } }).lean();
    const addrMap = {};
    addresses.forEach(a => { addrMap[a.address_id] = a; });

    const payments = await Payment.find({ order_id: { $in: orderIds } }).lean();
    const payMap = {};
    payments.forEach(p => { payMap[p.order_id] = p; });

    // Collect all product IDs in orders
    const allProdIds = [];
    orders.forEach(o => (o.items || []).forEach(i => allProdIds.push(i.product_id)));
    const products = await Product.find({ product_id: { $in: allProdIds } }).lean();
    const prodMap = {};
    products.forEach(p => { prodMap[p.product_id] = p; });

    const formatted = orders.map(o => {
      const addr = addrMap[o.address_id] || {};
      const pay = payMap[o.order_id] || {};
      const enrichedItems = (o.items || []).map(item => {
        const p = prodMap[item.product_id] || {};
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          name: p.name || 'Product',
          image_url: p.image_url || '',
          line_total: (item.quantity * item.unit_price).toFixed(2)
        };
      });

      return {
        order_id: o.order_id,
        status: o.status,
        subtotal: o.subtotal,
        discount: o.discount,
        total_amount: o.total_amount,
        created_at: o.created_at,
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || '',
        payment_method: pay.method || 'Online',
        payment_status: pay.status || 'completed',
        payment_provider: pay.provider || 'Online',
        transaction_ref: pay.transaction_ref || '',
        items: enrichedItems
      };
    });

    return res.json({ success: true, orders: formatted });
  } catch (err) {
    console.error('GetOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.user_id;

    const order = await Order.findOne({ order_id: id, user_id: userId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const addr = await Address.findOne({ address_id: order.address_id }).lean();
    const pay = await Payment.findOne({ order_id: id }).lean();

    const prodIds = (order.items || []).map(i => i.product_id);
    const products = await Product.find({ product_id: { $in: prodIds } }).lean();
    const prodMap = {};
    products.forEach(p => { prodMap[p.product_id] = p; });

    const enrichedItems = (order.items || []).map(item => {
      const p = prodMap[item.product_id] || {};
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        name: p.name || 'Product',
        image_url: p.image_url || '',
        brand: p.brand || ''
      };
    });

    return res.json({
      success: true,
      order: {
        ...order,
        street: addr?.street || '',
        city: addr?.city || '',
        state: addr?.state || '',
        zip: addr?.zip || '',
        country: addr?.country || 'India',
        payment_method: pay?.method || 'Online',
        payment_status: pay?.status || 'completed',
        payment_provider: pay?.provider || 'Online',
        transaction_ref: pay?.transaction_ref || '',
        paid_at: pay?.paid_at,
        items: enrichedItems
      }
    });
  } catch (err) {
    console.error('GetOrderById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user.user_id }).sort({ is_default: -1, address_id: 1 }).lean();
    return res.json({ success: true, addresses });
  } catch (err) {
    console.error('GetAddresses error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /addresses
const addAddress = async (req, res) => {
  try {
    const { label = 'Home', street, city, state, zip, country = 'India', is_default = 0 } = req.body;
    if (!street || !city || !state || !zip) {
      return res.status(400).json({ success: false, message: 'street, city, state, zip are required.' });
    }

    const defaultFlag = Boolean(is_default);
    if (defaultFlag) {
      await Address.updateMany({ user_id: req.user.user_id }, { is_default: false });
    }

    const addressId = await getNextSequence('address_id');
    const newAddr = await Address.create({
      address_id: addressId,
      user_id: req.user.user_id,
      label,
      street,
      city,
      state,
      zip,
      country,
      is_default: defaultFlag
    });

    return res.status(201).json({ success: true, address_id: addressId, message: 'Address added.' });
  } catch (err) {
    console.error('AddAddress error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  getAddresses,
  addAddress,
  validateCoupon,
  createRazorpayOrder,
  verifyRazorpayOrder,
  cancelOrder,
  getPaymentConfig
};
