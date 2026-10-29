const Review  = require('../models/Review');
const Product = require('../models/Product');
const { getNextSequence } = require('../models/Counter');

// POST /api/reviews
const submitReview = async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body;
    const userId = req.user.user_id;

    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID and rating are required.' });
    }

    const prodId = parseInt(product_id);
    const starRating = parseInt(rating);

    let review = await Review.findOne({ product_id: prodId, user_id: userId });
    if (review) {
      review.rating = starRating;
      review.title = title || '';
      review.body = body || '';
      review.created_at = new Date();
      await review.save();
    } else {
      const reviewId = await getNextSequence('review_id');
      await Review.create({
        review_id: reviewId,
        product_id: prodId,
        user_id: userId,
        rating: starRating,
        title: title || '',
        body: body || '',
        created_at: new Date()
      });
    }

    return res.json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('SubmitReview error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/reviews/user
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reviews = await Review.find({ user_id: userId }).sort({ created_at: -1 }).lean();

    const prodIds = reviews.map(r => r.product_id);
    const products = await Product.find({ product_id: { $in: prodIds } }).lean();
    const prodMap = {};
    products.forEach(p => { prodMap[p.product_id] = p; });

    const formatted = reviews.map(r => ({
      ...r,
      product_name: prodMap[r.product_id]?.name || 'Product',
      image_url: prodMap[r.product_id]?.image_url || ''
    }));

    return res.json({ success: true, reviews: formatted });
  } catch (err) {
    console.error('GetUserReviews error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { submitReview, getUserReviews };
