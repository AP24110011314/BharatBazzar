const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cart_item_id: { type: Number },
  product_id:   { type: Number, required: true },
  quantity:     { type: Number, required: true, default: 1, min: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  cart_id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, unique: true, index: true },
  items:   [cartItemSchema]
});

module.exports = mongoose.model('Cart', cartSchema);

