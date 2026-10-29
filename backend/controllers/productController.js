const Product   = require('../models/Product');
const Category  = require('../models/Category');
const Inventory = require('../models/Inventory');
const Review    = require('../models/Review');
const User      = require('../models/User');

// GET /products
const getProducts = async (req, res) => {
  try {
    const { category, search, min_price, max_price, sort } = req.query;

    const query = { is_active: true };

    const catParam = category || req.query.category_id;
    if (catParam) {
      query.category_id = parseInt(catParam);
    }

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { description: reg }, { brand: reg }];
    }

    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = parseFloat(min_price);
      if (max_price) query.price.$lte = parseFloat(max_price);
    }

    // Fetch products and all supporting data in parallel from MongoDB Atlas
    const [rawProducts, categories, inventories, reviews] = await Promise.all([
      Product.find(query).lean(),
      Category.find({}).lean(),
      Inventory.find({}).lean(),
      Review.find({}).lean()
    ]);

    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.name; });

    const invMap = {};
    inventories.forEach(i => { invMap[i.product_id] = i.quantity; });

    const reviewStats = {};
    reviews.forEach(r => {
      if (!reviewStats[r.product_id]) {
        reviewStats[r.product_id] = { total: 0, count: 0 };
      }
      reviewStats[r.product_id].total += r.rating;
      reviewStats[r.product_id].count += 1;
    });

    // Enrich products
    let products = rawProducts.map(p => {
      const stats = reviewStats[p.product_id] || { total: 0, count: 0 };
      return {
        ...p,
        category: catMap[p.category_id] || 'Uncategorized',
        stock: invMap[p.product_id] !== undefined ? invMap[p.product_id] : 0,
        avg_rating: stats.count > 0 ? parseFloat((stats.total / stats.count).toFixed(2)) : 0,
        review_count: stats.count
      };
    });

    // Sort
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.avg_rating - a.avg_rating);
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      products.sort((a, b) => a.product_id - b.product_id);
    }

    return res.json({ success: true, products });
  } catch (err) {
    console.error('GetProducts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await Product.findOne({ product_id: id, is_active: true }).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const cat = await Category.findOne({ category_id: product.category_id }).lean();
    const inv = await Inventory.findOne({ product_id: id }).lean();
    const reviewsList = await Review.find({ product_id: id }).sort({ created_at: -1 }).limit(10).lean();

    // Map reviewer names
    const userIds = reviewsList.map(r => r.user_id);
    const users = await User.find({ user_id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u.name; });

    const formattedReviews = reviewsList.map(r => ({
      rating: r.rating,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      reviewer: userMap[r.user_id] || 'Customer'
    }));

    const totalStars = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = reviewsList.length > 0 ? parseFloat((totalStars / reviewsList.length).toFixed(2)) : 0;

    const enriched = {
      ...product,
      category: cat ? cat.name : 'Uncategorized',
      stock: inv ? inv.quantity : 0,
      avg_rating: avgRating,
      review_count: reviewsList.length
    };

    return res.json({ success: true, product: enriched, reviews: formattedReviews });
  } catch (err) {
    console.error('GetProductById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return res.json({ success: true, categories });
  } catch (err) {
    console.error('GetCategories error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getProducts, getProductById, getCategories };
