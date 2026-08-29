const express = require('express');
const { getPriceTableForTrader } = require('../controllers/priceTableController');
const router = express.Router();

router.get('/:traderId', getPriceTableForTrader);

module.exports = router;