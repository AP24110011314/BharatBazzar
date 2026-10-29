const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true, index: true },
  quantity:   { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model('Inventory', inventorySchema);

