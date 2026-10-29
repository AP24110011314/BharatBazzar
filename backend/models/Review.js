const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review_id:  { type: Number, unique: true, index: true },
  product_id: { type: Number, required: true, index: true },
  user_id:    { type: Number, required: true, index: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  title:      { type: String, default: '' },
  body:       { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

