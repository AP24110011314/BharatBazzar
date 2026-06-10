const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders, updateOrderStatus, getOrderDetails,
  getAllProducts, createProduct, updateProduct, deleteProduct,
  getTopProducts,
  updateInventory,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllCoupons, createCoupon, updateCoupon, toggleCoupon,
  getUserSummary, updateUserRole, deleteUser
} = require('../controllers/adminController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// Orders
router.get('/orders',              getAllOrders);
router.get('/orders/:id',          getOrderDetails);
router.put('/orders/:id/status',   updateOrderStatus);

// Products
router.get('/products',            getAllProducts);
router.post('/products',           createProduct);
router.put('/products/:id',        updateProduct);
router.delete('/products/:id',     deleteProduct);
router.get('/top-products',        getTopProducts);

// Inventory
router.put('/inventory/:id',       updateInventory);

// Categories
router.get('/categories',          getAllCategories);
router.post('/categories',         createCategory);
router.put('/categories/:id',      updateCategory);
router.delete('/categories/:id',   deleteCategory);

// Coupons
router.get('/coupons',             getAllCoupons);
router.post('/coupons',            createCoupon);
router.put('/coupons/:id',         updateCoupon);
router.put('/coupons/:id/toggle',  toggleCoupon);

// Users
router.get('/user-summary',        getUserSummary);
router.put('/users/:id/role',      updateUserRole);
router.delete('/users/:id',        deleteUser);

module.exports = router;
