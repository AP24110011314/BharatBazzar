const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  address_id: { type: Number, unique: true, index: true },
  user_id:    { type: Number, required: true, index: true },
  label:      { type: String, default: 'Home' },
  street:     { type: String, required: true },
  city:       { type: String, required: true },
  state:      { type: String, required: true },
  zip:        { type: String, required: true },
  country:    { type: String, default: 'India' },
  is_default: { type: Boolean, default: false }
});

module.exports = mongoose.model('Address', addressSchema);

