const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Public routes
router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/markets', require('./marketRoutes'));
router.use('/pricetable', require('./priceTableRoutes'));
router.use('/reviews', require('./reviewRoutes'));

// Protected routes
router.use('/users', auth, require('./userRoutes'));
router.use('/cart', auth, role('customer'), require('./cartRoutes'));
router.use('/orders', auth, require('./orderRoutes'));
// ✅ Fixed: loyalty routes no longer require role('customer')
router.use('/loyalty', auth, require('./loyaltyRoutes.js'));
router.use('/delivery', auth, role('agent'), require('./deliveryRoutes'));
router.use('/notifications', auth, require('./notificationRoutes'));

// Trader routes
router.use('/trader', auth, role('trader'), require('./traderRoutes'));

// Promo codes (trader)
router.use('/promo', auth, role('trader'), require('./promoRoutes'));

// Admin routes
router.use('/admin', auth, role('admin'), require('./adminRoutes'));

module.exports = router;