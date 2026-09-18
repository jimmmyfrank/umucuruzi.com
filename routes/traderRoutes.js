const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');
const {
  getProfile, updateProfile,
  createProduct, getProducts, updateProduct, deleteProduct, getProductById,
  getPriceTable, addPriceTableItem, updatePriceTableItem, deletePriceTableItem,
  getOrders, getTraderOrders, getCustomerOrders,
  updateOrderStatus, getLoyalCustomers, assignAgent, getDashboardStats,
  getTraderQR, getNearbyTraders, getBusinessCategories,
} = require('../controllers/traderController');

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Dashboard + QR
router.get('/dashboard', getDashboardStats);
router.get('/qr', getTraderQR);

// Products
router.post('/products', upload.array('images', 5), createProduct);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    } else if (err) {
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: err.message });
    }
    updateProduct(req, res);
  });
});
router.delete('/products/:id', deleteProduct);

// Price Table
router.get('/pricetable', getPriceTable);
router.post('/pricetable', addPriceTableItem);
router.put('/pricetable/:id', updatePriceTableItem);
router.delete('/pricetable/:id', deletePriceTableItem);

// Orders — trader-side
router.get('/orders', getOrders);              // main endpoint used by trader app
router.get('/orders/trader', getTraderOrders); // alias if your app calls it
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/assign-agent', assignAgent);

// Customers (loyalty)
router.get('/customers', getLoyalCustomers);

// Public
router.get('/nearby', getNearbyTraders);
router.get('/business-categories', getBusinessCategories);

module.exports = router;
