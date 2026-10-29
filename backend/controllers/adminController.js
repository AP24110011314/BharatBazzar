const User      = require('../models/User');
const Order     = require('../models/Order');
const Product   = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category  = require('../models/Category');
const Coupon    = require('../models/Coupon');
const Review    = require('../models/Review');
const Payment   = require('../models/Payment');
const Address   = require('../models/Address');
const { getNextSequence } = require('../models/Counter');

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

const getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'cancelled' } }).lean();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;

    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({ is_active: true });
    const lowStock = await Inventory.countDocuments({ quantity: { $lt: 10 } });
    const totalCoupons = await Coupon.countDocuments({ is_active: true });
    const totalCategories = await Category.countDocuments({});

    const statsObj = {
      total_revenue: totalRevenue.toFixed(2),
      total_orders: totalOrders,
      total_users: totalUsers,
      total_products: totalProducts,
      low_stock: lowStock,
      total_coupons: totalCoupons,
      total_categories: totalCategories
    };

    return res.json({
      success: true,
      stats: statsObj,
      ...statsObj
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
    const orders = await Order.find({}).sort({ created_at: -1 }).limit(200).lean();

    const userIds = orders.map(o => o.user_id);
    const orderIds = orders.map(o => o.order_id);

    const users = await User.find({ user_id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    const payments = await Payment.find({ order_id: { $in: orderIds } }).lean();
    const payMap = {};
    payments.forEach(p => { payMap[p.order_id] = p; });

    const formatted = orders.map(o => {
      const u = userMap[o.user_id] || {};
      const p = payMap[o.order_id] || {};
      return {
        order_id: o.order_id,
        status: o.status,
        total_amount: o.total_amount,
        subtotal: o.subtotal,
        discount: o.discount,
        created_at: o.created_at,
        user_name: u.name || 'Unknown User',
        email: u.email || '',
        payment_method: p.method || 'Online',
        payment_status: p.status || 'completed'
      };
    });

    return res.json({ success: true, orders: formatted });
  } catch (err) {
    console.error('GetAllOrders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const existingOrder = await Order.findOne({ order_id: id });
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = existingOrder.status;

    // Handle inventory restoration/deduction upon cancellation
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of existingOrder.items || []) {
        await Inventory.findOneAndUpdate(
          { product_id: item.product_id },
          { $inc: { quantity: item.quantity } }
        );
      }
      await Payment.findOneAndUpdate({ order_id: id }, { status: 'refunded' });
    } else if (previousStatus === 'cancelled' && status !== 'cancelled') {
      for (const item of existingOrder.items || []) {
        await Inventory.findOneAndUpdate(
          { product_id: item.product_id },
          { $inc: { quantity: -item.quantity } }
        );
      }
      await Payment.findOneAndUpdate({ order_id: id }, { status: 'completed' });
    }

    existingOrder.status = status;
    await existingOrder.save();

    return res.json({ success: true, message: `Order #${id} status updated to ${status}.` });
  } catch (err) {
    console.error('UpdateOrderStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await Order.findOne({ order_id: id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const user = await User.findOne({ user_id: order.user_id }).lean();
    const address = await Address.findOne({ address_id: order.address_id }).lean();
    const payment = await Payment.findOne({ order_id: id }).lean();

    const prodIds = (order.items || []).map(i => i.product_id);
    const products = await Product.find({ product_id: { $in: prodIds } }).lean();
    const prodMap = {};
    products.forEach(p => { prodMap[p.product_id] = p; });

    const items = (order.items || []).map(i => {
      const p = prodMap[i.product_id] || {};
      return {
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        product_name: p.name || 'Product',
        image_url: p.image_url || '',
        brand: p.brand || ''
      };
    });

    const orderData = {
      ...order,
      user_name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address_label: address?.label || 'Home',
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      zip: address?.zip || '',
      country: address?.country || 'India'
    };

    return res.json({
      success: true,
      order: orderData,
      items,
      payment: payment || null
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
    const products = await Product.find({}).sort({ product_id: -1 }).lean();

    const categories = await Category.find({}).lean();
    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.name; });

    const inventories = await Inventory.find({}).lean();
    const invMap = {};
    inventories.forEach(i => { invMap[i.product_id] = i.quantity; });

    const reviews = await Review.find({}).lean();
    const reviewStats = {};
    reviews.forEach(r => {
      if (!reviewStats[r.product_id]) reviewStats[r.product_id] = { total: 0, count: 0 };
      reviewStats[r.product_id].total += r.rating;
      reviewStats[r.product_id].count += 1;
    });

    const formatted = products.map(p => {
      const stats = reviewStats[p.product_id] || { total: 0, count: 0 };
      return {
        ...p,
        category: catMap[p.category_id] || 'Uncategorized',
        stock: invMap[p.product_id] !== undefined ? invMap[p.product_id] : 0,
        avg_rating: stats.count > 0 ? parseFloat((stats.total / stats.count).toFixed(2)) : 0,
        review_count: stats.count
      };
    });

    return res.json({ success: true, products: formatted });
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

    const productId = await getNextSequence('product_id');

    await Product.create({
      product_id: productId,
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      image_url: image_url || '',
      brand: brand || '',
      category_id: category_id ? parseInt(category_id) : null,
      is_active: true,
      created_at: new Date()
    });

    await Inventory.create({
      product_id: productId,
      quantity: parseInt(stock) || 0
    });

    return res.status(201).json({ success: true, message: 'Product created successfully.', product_id: productId });
  } catch (err) {
    console.error('CreateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, image_url, brand, category_id, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (image_url !== undefined) updates.image_url = image_url;
    if (brand !== undefined) updates.brand = brand;
    if (category_id !== undefined) updates.category_id = category_id ? parseInt(category_id) : null;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const product = await Product.findOneAndUpdate({ product_id: id }, updates, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('UpdateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await Product.findOneAndUpdate({ product_id: id }, { is_active: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    return res.json({ success: true, message: 'Product deactivated successfully.' });
  } catch (err) {
    console.error('DeleteProduct error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  TOP PRODUCTS
// ═══════════════════════════════════════════════════════════════

const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await Order.find({ status: { $ne: 'cancelled' } }).lean();

    const salesMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!salesMap[item.product_id]) {
          salesMap[item.product_id] = { total_sold: 0, total_revenue: 0 };
        }
        salesMap[item.product_id].total_sold += item.quantity;
        salesMap[item.product_id].total_revenue += (item.quantity * item.unit_price);
      });
    });

    const activeProducts = await Product.find({ is_active: true }).lean();
    const categories = await Category.find({}).lean();
    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.name; });

    const inventories = await Inventory.find({}).lean();
    const invMap = {};
    inventories.forEach(i => { invMap[i.product_id] = i.quantity; });

    const reviews = await Review.find({}).lean();
    const reviewStats = {};
    reviews.forEach(r => {
      if (!reviewStats[r.product_id]) reviewStats[r.product_id] = { total: 0, count: 0 };
      reviewStats[r.product_id].total += r.rating;
      reviewStats[r.product_id].count += 1;
    });

    const list = [];
    activeProducts.forEach(p => {
      const sales = salesMap[p.product_id];
      const stats = reviewStats[p.product_id] || { total: 0, count: 0 };
      if (sales && sales.total_sold > 0) {
        list.push({
          product_id: p.product_id,
          product_name: p.name,
          price: p.price,
          image_url: p.image_url,
          category: catMap[p.category_id] || 'General',
          stock_remaining: invMap[p.product_id] !== undefined ? invMap[p.product_id] : 0,
          total_sold: sales.total_sold,
          total_revenue: parseFloat(sales.total_revenue.toFixed(2)),
          avg_rating: stats.count > 0 ? parseFloat((stats.total / stats.count).toFixed(2)) : 0
        });
      }
    });

    list.sort((a, b) => b.total_sold - a.total_sold);
    return res.json({ success: true, products: list.slice(0, limit) });
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
    const id = parseInt(req.params.id);
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
    }

    await Inventory.findOneAndUpdate(
      { product_id: id },
      { quantity: parseInt(quantity) },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({ success: true, message: `Stock updated to ${quantity} units.` });
  } catch (err) {
    console.error('UpdateInventory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.name; });

    // Count products per category
    const products = await Product.find({ is_active: true }).lean();
    const countMap = {};
    products.forEach(p => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    const formatted = categories.map(c => ({
      ...c,
      parent_name: c.parent_id ? (catMap[c.parent_id] || null) : null,
      product_count: countMap[c.category_id] || 0
    }));

    return res.json({ success: true, categories: formatted });
  } catch (err) {
    console.error('GetAllCategories error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const categoryId = await getNextSequence('category_id');
    await Category.create({
      category_id: categoryId,
      name: name.trim(),
      description: description || '',
      parent_id: parent_id ? parseInt(parent_id) : null
    });

    return res.status(201).json({ success: true, message: 'Category created.', category_id: categoryId });
  } catch (err) {
    console.error('CreateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, parent_id } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (parent_id !== undefined) updates.parent_id = parent_id ? parseInt(parent_id) : null;

    const cat = await Category.findOneAndUpdate({ category_id: id }, updates, { returnDocument: 'after' });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });

    return res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    console.error('UpdateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const count = await Product.countDocuments({ category_id: id, is_active: true });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${count} active product(s) use this category. Reassign them first.`
      });
    }

    const result = await Category.deleteOne({ category_id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('DeleteCategory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  COUPONS
// ═══════════════════════════════════════════════════════════════

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ coupon_id: -1 }).lean();
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

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const couponId = await getNextSequence('coupon_id');
    await Coupon.create({
      coupon_id: couponId,
      code: cleanCode,
      discount_type,
      discount_value: parseFloat(discount_value),
      min_order_amt: parseFloat(min_order_amt) || 0,
      max_uses: max_uses ? parseInt(max_uses) : null,
      is_active: true
    });

    return res.status(201).json({ success: true, message: 'Coupon created.', coupon_id: couponId });
  } catch (err) {
    console.error('CreateCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { code, discount_type, discount_value, min_order_amt, max_uses } = req.body;

    const updates = {};
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (discount_type !== undefined) updates.discount_type = discount_type;
    if (discount_value !== undefined) updates.discount_value = parseFloat(discount_value);
    if (min_order_amt !== undefined) updates.min_order_amt = parseFloat(min_order_amt);
    if (max_uses !== undefined) updates.max_uses = max_uses ? parseInt(max_uses) : null;

    const coupon = await Coupon.findOneAndUpdate({ coupon_id: id }, updates, { returnDocument: 'after' });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    return res.json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    console.error('UpdateCoupon error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const coupon = await Coupon.findOne({ coupon_id: id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    coupon.is_active = !coupon.is_active;
    await coupon.save();

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
    const users = await User.find({}).lean();
    const orders = await Order.find({}).lean();

    const orderStats = {};
    orders.forEach(o => {
      if (!orderStats[o.user_id]) orderStats[o.user_id] = { count: 0, spent: 0 };
      orderStats[o.user_id].count += 1;
      orderStats[o.user_id].spent += (o.total_amount || 0);
    });

    const formatted = users.map(u => {
      const stats = orderStats[u.user_id] || { count: 0, spent: 0 };
      return {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        created_at: u.created_at,
        total_orders: stats.count,
        total_spent: parseFloat(stats.spent.toFixed(2))
      };
    });

    formatted.sort((a, b) => b.total_spent - a.total_spent);
    return res.json({ success: true, users: formatted });
  } catch (err) {
    console.error('GetUserSummary error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "customer" or "admin".' });
    }

    if (id === req.user.user_id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself.' });
    }

    const user = await User.findOneAndUpdate({ user_id: id }, { role }, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({ success: true, message: `User #${id} role changed to ${role}.` });
  } catch (err) {
    console.error('UpdateUserRole error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (id === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const orderCount = await Order.countDocuments({ user_id: id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user — they have existing orders. Remove or reassign orders first.'
      });
    }

    const result = await User.deleteOne({ user_id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await Address.deleteMany({ user_id: id });
    await Review.deleteMany({ user_id: id });

    return res.json({ success: true, message: `User #${id} deleted.` });
  } catch (err) {
    console.error('DeleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders, updateOrderStatus, getOrderDetails,
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getTopProducts,
  updateInventory,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllCoupons, createCoupon, updateCoupon, toggleCoupon,
  getUserSummary, updateUserRole, deleteUser
};
