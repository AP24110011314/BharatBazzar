const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id:      { type: Number, unique: true, index: true },
  order_id:        { type: Number, required: true, unique: true, index: true },
  method:          { type: String, required: true },
  status:          {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  transaction_ref:     { type: String, required: true },
  provider:            { type: String, default: 'Atlas Pay' },
  razorpay_order_id:   { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  razorpay_signature:  { type: String, default: null },
  paid_at:             { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);

