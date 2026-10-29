const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ user_id: decoded.user_id }).lean();
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    
    req.user = { user_id: user.user_id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
