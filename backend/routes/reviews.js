const express = require('express');
const router = express.Router();
const { submitReview, getUserReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', submitReview);
router.get('/user', getUserReviews);

module.exports = router;
