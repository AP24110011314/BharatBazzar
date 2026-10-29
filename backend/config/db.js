const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in your environment variables.');
  console.error('Please configure MONGODB_URI in backend/.env');
  process.exit(1);
}

const dbName = process.env.DB_NAME || 'shopdb';

mongoose.set('strictQuery', false);

// Connect to MongoDB Atlas
mongoose.connect(uri, {
  dbName,
})
  .then(() => {
    console.log(`✅ MongoDB Atlas connected successfully to database "${dbName}"`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = mongoose;
