const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user_id:    { type: Number, required: true, index: true },
  product_id: { type: Number, required: true, index: true }
});

wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);

