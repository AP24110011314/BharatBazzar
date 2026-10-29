const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  coupon_id:      { type: Number, unique: true, index: true },
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount_type:  { type: String, enum: ['percent', 'flat'], required: true },
  discount_value: { type: Number, required: true },
  min_order_amt:  { type: Number, default: 0 },
  max_uses:       { type: Number, default: null },
  uses_count:     { type: Number, default: 0 },
  is_active:      { type: Boolean, default: true }
});

module.exports = mongoose.model('Coupon', couponSchema);

