const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id:  { type: Number, unique: true, index: true },
  category_id: { type: Number, default: null, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  image_url:   { type: String, default: '' },
  brand:       { type: String, default: '' },
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);

