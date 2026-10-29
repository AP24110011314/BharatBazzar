const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id:    { type: Number, unique: true, index: true },
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  phone:      { type: String, default: null },
  role:       { type: String, enum: ['customer', 'admin'], default: 'customer' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

