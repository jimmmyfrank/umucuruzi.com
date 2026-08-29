const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getMyPromoCodes,
  createPromoCode,
  deletePromoCode,
  togglePromoCode,
  validatePromoCode,
  sendPromoCodeToLoyalCustomers, // ✅ ensure this is exported
} = require('../controllers/promoController');

// Trader routes
router.get('/my', auth, role('trader'), getMyPromoCodes);
router.post('/', auth, role('trader'), createPromoCode);
router.delete('/:id', auth, role('trader'), deletePromoCode);
router.patch('/:id/toggle', auth, role('trader'), togglePromoCode);
router.post('/:id/send-to-loyal', auth, role('trader'), sendPromoCodeToLoyalCustomers);

// Public validation (customer)
router.get('/validate', auth, validatePromoCode);

module.exports = router;