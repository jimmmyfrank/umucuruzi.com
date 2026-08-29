const express = require('express');
const { getActiveAds } = require('../controllers/adController');
const router = express.Router();

router.get('/', getActiveAds);

module.exports = router;