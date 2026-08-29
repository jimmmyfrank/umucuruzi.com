const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ Must import multer
const upload = require('../middleware/upload');
const {
  getProfile, updateProfile,
  createProduct, getProducts, updateProduct, deleteProduct,
  getPriceTable, addPriceTableItem, updatePriceTableItem, deletePriceTableItem,
  getOrders, updateOrderStatus, getLoyalCustomers,getProductById,assignAgent,getDashboardStats,
  getTraderQRerQR , getTraderQR
} = require('../controllers/traderController');

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Products with multer error handling
router.post('/products', upload.array('images', 5), createProduct);
router.get('/dashboard', getDashboardStats);
router.get('/qr', getTraderQR); 
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

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/assign-agent', assignAgent);

// Customers (loyalty)
router.get('/customers', getLoyalCustomers);

module.exports = router;