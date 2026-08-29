const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// ✅ Import login from AuthController
const { login } = require('../controllers/AuthController');

// Keep other admin controller functions
const {
  getAllUsers, toggleUserStatus,
  createAd, getAds, updateAd, deleteAd,
  getSettings, updateSetting, getStats,
  createMarket, getAllMarkets, updateMarket, deleteMarket,
  createCategory, getAllCategories, updateCategory, deleteCategory
} = require('../controllers/adminController');

// 🟢 PUBLIC ROUTE – Now uses the proven login logic
router.post('/login', login);

// 🔒 PROTECTED ROUTES (everything else)
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/ads', getAds);
router.post('/ads', createAd);
router.put('/ads/:id', updateAd);
router.delete('/ads/:id', deleteAd);
router.get('/settings', getSettings);
router.put('/settings', updateSetting);
router.get('/markets', getAllMarkets);
router.post('/markets', createMarket);
router.put('/markets/:id', updateMarket);
router.delete('/markets/:id', deleteMarket);
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;