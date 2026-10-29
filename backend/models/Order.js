const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: Number, required: true },
  quantity:   { type: Number, required: true },
  unit_price: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  order_id:     { type: Number, unique: true, index: true },
  user_id:      { type: Number, required: true, index: true },
  address_id:   { type: Number, default: null },
  status:       {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal:     { type: Number, required: true, default: 0 },
  discount:     { type: Number, default: 0 },
  total_amount: { type: Number, required: true, default: 0 },
  created_at:   { type: Date, default: Date.now },
  items:        [orderItemSchema]
});

module.exports = mongoose.model('Order', orderSchema);

