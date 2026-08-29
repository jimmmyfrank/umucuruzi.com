const express = require('express');
const { getRequests, acceptRequest, updateDeliveryStatus } = require('../controllers/deliveryController');
const router = express.Router();

router.get('/requests', getRequests);
router.put('/requests/:id/accept', acceptRequest);
router.put('/requests/:id/status', updateDeliveryStatus);

module.exports = router;