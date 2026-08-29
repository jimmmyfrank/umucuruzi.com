const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getLoyaltyStatus,
  getReferrals,
  getNotifications,
  markNotificationRead,
  getTraders,
  getTraderById,
  getAgents,
  getUserById,
} = require('../controllers/userController');
const auth = require('../middleware/auth')
const { savePushToken } = require('../controllers/userController');

// ─── Profile ──────────────────────────────────────────────────────────
router.get('/me', getProfile);
router.put('/me', updateProfile);

// ─── Traders (public) ──────────────────────────────────────────────
router.get('/traders', getTraders);
router.get('/traders/:id', getTraderById);

// ─── Agents ──────────────────────────────────────────────────────────
router.get('/agents', getAgents);

// ─── Loyalty, Referrals, Notifications ──────────────────────────────
router.get('/loyalty', getLoyaltyStatus);
router.get('/referrals', getReferrals);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// ─── Generic user lookup (must be last) ───────────────────────────
router.get('/:id', getUserById);
// routes/userRoutes.js
router.post('/push-token', auth, savePushToken);

module.exports = router;

