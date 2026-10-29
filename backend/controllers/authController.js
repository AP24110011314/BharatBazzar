const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Cart   = require('../models/Cart');
const { getNextSequence } = require('../models/Counter');

// POST /register
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing user
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = await getNextSequence('user_id');

    const newUser = await User.create({
      user_id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashed,
      phone: phone || null,
      role: 'customer'
    });

    // Create an empty cart for the new user
    const cartId = await getNextSequence('cart_id');
    await Cart.create({
      cart_id: cartId,
      user_id: userId,
      items: []
    });

    const token = jwt.sign(
      { user_id: userId, email: cleanEmail, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { user_id: userId, name: newUser.name, email: cleanEmail, role: 'customer' }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Ensure user has a cart
    let userCart = await Cart.findOne({ user_id: user.user_id });
    if (!userCart) {
      const cartId = await getNextSequence('cart_id');
      await Cart.create({ cart_id: cartId, user_id: user.user_id, items: [] });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /me
const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { register, login, getMe };
