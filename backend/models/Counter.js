const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq:  { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return counter.seq;
}

module.exports = { Counter, getNextSequence };
