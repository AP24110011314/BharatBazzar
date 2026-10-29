const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_id: { type: Number, unique: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  parent_id:   { type: Number, default: null }
});

module.exports = mongoose.model('Category', categorySchema);

