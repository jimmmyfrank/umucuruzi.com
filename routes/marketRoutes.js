const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const {
  getAllMarkets, getMarketById, createMarket, updateMarket,
  joinMarket, leaveMarket, getMyMarkets
} = require('../controllers/marketController');

// ─── Public routes ────────────────────────────────────────────────────
router.get('/', getAllMarkets);

// ─── Protected routes (specific first) ───────────────────────────────
router.get('/my-markets', auth, role('trader'), getMyMarkets);
router.delete('/:id/leave', auth, leaveMarket); // ⚠️ MUST BE BEFORE /:id

// ─── Generic parameterized routes (must come last) ──────────────────
router.get('/:id', getMarketById);
router.post('/', auth, createMarket);
router.put('/:id', auth, updateMarket);
router.post('/:id/join', auth, joinMarket);

module.exports = router;