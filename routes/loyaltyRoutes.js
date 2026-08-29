const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loyaltyController = require('../controllers/loyaltyController');

// All loyalty routes require authentication only – no role checks
router.get('/trader/loyal-customers', auth, loyaltyController.getLoyalCustomers);
router.get('/trader/delivery-agents', auth, loyaltyController.getTraderDeliveryAgents);
router.get('/customer/trusted-traders', auth, loyaltyController.getTrustedTraders);
router.get('/customer/delivery-agents', auth, loyaltyController.getCustomerDeliveryAgents);
router.get('/agent/delivery-history', auth, loyaltyController.getAgentDeliveryHistory);
router.get('/agent/:agentId/deliveries', auth, loyaltyController.getAgentDeliveriesById);

module.exports = router;